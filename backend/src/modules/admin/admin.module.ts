import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthDevMiddleware } from '../../middlewares/auth-dev.middleware';
import { AdminAIController } from './admin-ai.controller';
import { AdminAIService } from './admin-ai.service';
import { AdminLeadsController } from './admin-leads.controller';
import { AdminLeadsService } from './admin-leads.service';

@Module({
  controllers: [AdminLeadsController, AdminAIController],
  providers: [AdminLeadsService, AdminAIService],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthDevMiddleware)
      .forRoutes(AdminLeadsController, AdminAIController);
  }
}
