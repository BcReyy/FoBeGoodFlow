
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MenuItem } from '../entities/menu-item.entity';
import { NotificationsModule } from '../notifications/notifications.module';

import { MenuItemsController } from './menu-items.controller';
import { MenuItemsService } from './menu-items.service';
import { AdminGuard } from './admin.guard';

import { LowStockInventoryController } from './low-stock.controller';
import { LowStockInventoryService } from './low-stock.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem]),
    NotificationsModule,
  ],

  controllers: [
    // Register the static low-stock route first,
    // before the existing /menu-items/:id route.
    LowStockInventoryController,
    MenuItemsController,
  ],

  providers: [
    MenuItemsService,
    AdminGuard,
    LowStockInventoryService,
  ],

  exports: [
    MenuItemsService,
  ],
})
export class MenuItemsModule {}
