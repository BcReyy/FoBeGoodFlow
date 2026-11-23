
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Notification } from '../entities/notification.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class LowStockAlertsService {

  async notifyOnLowStockTransition(
    manager: EntityManager,
    product: MenuItem,
    wasLowStock: boolean,
  ): Promise<void> {
    const isLowStock =
      product.stockQuantity <= product.minimumStockLevel;

    // Do not create an alert if stock is normal
    // or the product was already in low-stock status.
    if (!isLowStock || wasLowStock) {
      return;
    }

    const administrators = await manager
      .getRepository(User)
      .find({
        where: {
          role: 'Admin',
          isActive: true,
        },
      });

    if (administrators.length === 0) {
      return;
    }

    const message =
      `Low stock alert: ${product.itemName} ` +
      `(Product ID: ${product.menuItemId}) has ` +
      `${product.stockQuantity} unit(s) remaining. ` +
      `Minimum stock level: ${product.minimumStockLevel}.`;

    const notificationRepository =
      manager.getRepository(Notification);

    const createdAt = new Date();

    const notifications = administrators.map((admin) =>
      notificationRepository.create({
        userId: admin.userId,
        menuItemId: product.menuItemId,
        notificationType: 'LowStock',
        message: message.slice(0, 255),
        createdAt,
        isRead: false,
      }),
    );

    // Save notifications using the supplied transaction manager.
    await notificationRepository.save(notifications);
  }
}
