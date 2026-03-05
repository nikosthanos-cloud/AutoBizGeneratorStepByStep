import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

const ADMIN_PAYMENT_TO = 'nikosthanos@gmail.com';

export interface LeadDataForPayment {
  leadId: string;
  customerEmail: string | null;
  customerName: string | null;
  selectedPackage: string | null;
  stripeSessionId: string | null;
  amountTotalCents: number | null;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = process.env.NOTIFICATION_FROM_EMAIL ?? 'AdvisorAI <onboarding@resend.dev>';
  }

  /**
   * Sends an email to the admin (nikosthanos@gmail.com) with new payment details.
   */
  async sendAdminPaymentNotification(leadData: LeadDataForPayment): Promise<void> {
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY not set; skipping admin payment notification');
      return;
    }
    const amount =
      leadData.amountTotalCents != null
        ? `€${(leadData.amountTotalCents / 100).toFixed(2)}`
        : 'N/A';
    const html = [
      '<h2>Νέα πληρωμή</h2>',
      '<ul>',
      `<li><strong>Lead ID:</strong> ${escapeHtml(leadData.leadId)}</li>`,
      `<li><strong>Email πελάτη:</strong> ${escapeHtml(leadData.customerEmail ?? '—')}</li>`,
      `<li><strong>Όνομα πελάτη:</strong> ${escapeHtml(leadData.customerName ?? '—')}</li>`,
      `<li><strong>Πακέτο:</strong> ${escapeHtml(leadData.selectedPackage ?? '—')}</li>`,
      `<li><strong>Stripe Session:</strong> ${escapeHtml(leadData.stripeSessionId ?? '—')}</li>`,
      `<li><strong>Ποσό:</strong> ${amount}</li>`,
      '</ul>',
    ].join('');
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [ADMIN_PAYMENT_TO],
        subject: `[AdvisorAI] Νέα πληρωμή – Lead ${leadData.leadId}`,
        html,
      });
      if (error) {
        this.logger.warn(`Admin payment email failed: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      this.logger.warn(`Admin payment email error: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Sends the technical plan (Markdown) to the customer.
   */
  async sendCustomerBuildPrompt(customerEmail: string, buildPrompt: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY not set; skipping customer build prompt email');
      return;
    }
    const escaped = escapeHtml(buildPrompt);
    const html = [
      '<h2>Το τεχνικό σας πλάνο</h2>',
      '<p>Παρακάτω θα βρείτε το τεχνικό πλάνο που ετοιμάστηκε για το project σας.</p>',
      '<pre style="white-space: pre-wrap; font-family: inherit; background: #f5f5f5; padding: 1rem; border-radius: 6px;">',
      escaped,
      '</pre>',
    ].join('');
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [customerEmail],
        subject: 'Το τεχνικό σας πλάνο – AdvisorAI',
        html,
      });
      if (error) {
        this.logger.warn(`Customer build prompt email failed: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      this.logger.warn(
        `Customer build prompt email error: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
