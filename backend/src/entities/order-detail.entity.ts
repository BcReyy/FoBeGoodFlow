import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerOrder } from './customer-order.entity';
import { MenuItem } from './menu-item.entity';

@Entity('orderdetail')
export class OrderDetail {
  @PrimaryGeneratedColumn({ name: 'OrderDetailID' })
  orderDetailId!: number;

  @Column({ name: 'OrderID', type: 'int' })
  orderId!: number;

  @ManyToOne(() => CustomerOrder, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'OrderID',
    referencedColumnName: 'orderId',
  })
  order!: CustomerOrder;

  @Column({ name: 'MenuItemID', type: 'int' })
  menuItemId!: number;

  @ManyToOne(() => MenuItem, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'MenuItemID',
    referencedColumnName: 'menuItemId',
  })
  menuItem!: MenuItem;

  @Column({ name: 'Quantity', type: 'int' })
  quantity!: number;

  @Column({
    name: 'UnitPrice',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  unitPrice!: string;

  @Column({
    name: 'Subtotal',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  subtotal!: string;
}