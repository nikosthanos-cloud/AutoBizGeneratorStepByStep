import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../../common/prisma.service';
import { LeadStatus } from '@prisma/client';
import { EmailService, LeadDataForPayment } from '../notifications/email.service';

const LEAD_CONFIRMED_EVENT = 'lead.confirmed';

@Controller('api/webhooks')
@SkipThrottle()
export class StripeWebhookController {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    this.stripe = key ? new Stripe(key) : null;
  }

  @Post('stripe')
  async handleStripe(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    const rawBody = req.body;
    const payload = Buffer.isBuffer(rawBody) ? rawBody : (typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : null);
    if (!payload || payload.length === 0) {
      throw new BadRequestException('Missing or invalid body');
    }
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      throw new BadRequestException(`Stripe signature verification failed: ${message}`);
    }

    if (event.type === 'checkout.session.completed') {
      await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const clientReferenceId = session.client_reference_id ?? null;
    const customerEmail = session.customer_email ?? (typeof session.customer === 'string' ? null : (session.customer as Stripe.Customer)?.email) ?? null;

    let lead = null;
    if (clientReferenceId) {
      lead = await this.prisma.lead.findUnique({
        where: { id: clientReferenceId },
        include: { customer: true },
      });
    }
    if (!lead && customerEmail) {
      const customer = await this.prisma.customer.findUnique({
        where: { email: customerEmail },
        include: { leads: { orderBy: { created_at: 'desc' }, take: 1, include: { customer: true } } },
      });
      if (customer?.leads?.[0]) {
        lead = customer.leads[0];
      }
    }
    if (!lead) {
      return;
    }

    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status: LeadStatus.CONFIRMED },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: 'stripe_checkout_completed',
        entityType: 'lead',
        entityId: lead.id,
        payload: {
          stripeSessionId: session.id,
          clientReferenceId,
          customerEmail,
        } as object,
      },
    });

    const leadData: LeadDataForPayment = {
      leadId: lead.id,
      customerEmail: lead.customer?.email ?? customerEmail ?? null,
      customerName: lead.customer?.name ?? null,
      selectedPackage: lead.selectedPackage ?? null,
      stripeSessionId: session.id,
      amountTotalCents: session.amount_total ?? null,
    };
    await this.emailService.sendAdminPaymentNotification(leadData);

    this.eventEmitter.emit(LEAD_CONFIRMED_EVENT, { leadId: lead.id });
  }
}
