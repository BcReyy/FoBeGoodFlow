
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('menuitem')
export class MenuItem {
  @PrimaryGeneratedColumn({ name: 'MenuItemID' })
  menuItemId!: number;

  @Column({ name: 'ItemName', type: 'varchar', length: 100 })
  itemName!: string;

  @Column({ name: 'Category', type: 'varchar', length: 50 })
  category!: string;

  @Column({
    name: 'Description',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description!: string | null;

  @Column({
    name: 'Price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price!: string;

  @Column({
    name: 'StockQuantity',
    type: 'int',
    default: 0,
  })
  stockQuantity!: number;

  @Column({
    name: 'MinimumStockLevel',
    type: 'int',
    default: 5,
  })
  minimumStockLevel!: number;

  @Column({
    name: 'IsAvailable',
    type: 'boolean',
    default: true,
  })
  isAvailable!: boolean;

  @Column({ name: 'CreatedAt', type: 'datetime' })
  createdAt!: Date;
}
