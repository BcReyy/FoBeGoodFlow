import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { MenuItem } from './menu-item.entity';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn({ name: 'NotificationID' })
  notificationId!: number;

  @Column({ name: 'UserID', type: 'int' })
  userId!: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'UserID',
    referencedColumnName: 'userId',
  })
  user!: User;

  @Column({
    name: 'MenuItemID',
    type: 'int',
    nullable: true,
  })
  menuItemId!: number | null;

  @ManyToOne(() => MenuItem, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'MenuItemID',
    referencedColumnName: 'menuItemId',
  })
  menuItem!: MenuItem | null;

  @Column({
    name: 'NotificationType',
    type: 'varchar',
    length: 30,
  })
  notificationType!: string;

  @Column({
    name: 'Message',
    type: 'varchar',
    length: 255,
  })
  message!: string;

  @Column({ name: 'CreatedAt', type: 'datetime' })
  createdAt!: Date;

  @Column({
    name: 'IsRead',
    type: 'boolean',
    default: false,
  })
  isRead!: boolean;
}