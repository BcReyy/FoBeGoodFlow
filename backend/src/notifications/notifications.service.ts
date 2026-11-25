
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository:
      Repository<Notification>,
  ) {}


  async findAllForUser(userId: number) {
    const notifications =
      await this.notificationsRepository.find({
        where: {
          userId,
        },
        order: {
          createdAt: 'DESC',
          notificationId: 'DESC',
        },
      });

    return notifications.map((notification) => ({
      notificationId: notification.notificationId,
      menuItemId: notification.menuItemId,
      notificationType: notification.notificationType,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
    }));
  }


  async getUnreadCount(userId: number) {
    const unreadCount =
      await this.notificationsRepository.count({
        where: {
          userId,
          isRead: false,
        },
      });

    return {
      unreadCount,
    };
  }


  async markAsRead(
    notificationId: number,
    userId: number,
  ) {
    const notification =
      await this.notificationsRepository.findOne({
        where: {
          notificationId,
          userId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} was not found.`,
      );
    }

    if (!notification.isRead) {
      await this.notificationsRepository.update(
        {
          notificationId,
          userId,
          isRead: false,
        },
        {
          isRead: true,
        },
      );
    }

    return {
      notificationId: notification.notificationId,
      message: notification.message,
      isRead: true,
    };
  }


  async markAllAsRead(userId: number) {
    const result =
      await this.notificationsRepository.update(
        {
          userId,
          isRead: false,
        },
        {
          isRead: true,
        },
      );

    return {
      message: 'Notifications marked as read.',
      updatedCount: result.affected ?? 0,
    };
  }
}
