
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from '../entities/notification.entity';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { LowStockAlertsService } from './low-stock-alerts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
  ],

  controllers: [
    NotificationsController,
  ],

  providers: [
    NotificationsService,
    LowStockAlertsService,
  ],

  exports: [
    LowStockAlertsService,
  ],
})
export class NotificationsModule {}
