import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('customerorder')
export class CustomerOrder {
  @PrimaryGeneratedColumn({ name: 'OrderID' })
  orderId!: number;

  @Column({
    name: 'OrderNumber',
    type: 'varchar',
    length: 30,
    unique: true,
  })
  orderNumber!: string;

  @Column({
    name: 'CustomerID',
    type: 'int',
    nullable: true,
  })
  customerId!: number | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'CustomerID',
    referencedColumnName: 'userId',
  })
  customer!: User | null;

  @Column({ name: 'CashierID', type: 'int' })
  cashierId!: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'CashierID',
    referencedColumnName: 'userId',
  })
  cashier!: User;

  @Column({ name: 'OrderDate', type: 'datetime' })
  orderDate!: Date;

  @Column({
    name: 'OrderStatus',
    type: 'varchar',
    length: 20,
  })
  orderStatus!: string;

  @Column({
    name: 'TotalAmount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalAmount!: string;
}