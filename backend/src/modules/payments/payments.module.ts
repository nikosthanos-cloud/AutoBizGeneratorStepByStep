import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from '../notifications/notifications.module';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [EventEmitterModule, NotificationsModule],
  controllers: [StripeWebhookController],
})
export class PaymentsModule {}
