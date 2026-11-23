
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DataSource,
  EntityManager,
} from 'typeorm';

import { MenuItem } from '../entities/menu-item.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class LowStockInventoryService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}


  private async requireAdmin(
    manager: EntityManager,
    userId: number,
  ): Promise<void> {
    const user = await manager
      .getRepository(User)
      .findOne({
        where: { userId },
      });

    if (
      !user ||
      !user.isActive ||
      user.role !== 'Admin'
    ) {
      throw new ForbiddenException(
        'Only active Admin accounts can manage inventory.',
      );
    }
  }


  async getLowStockProducts(userId: number) {
    await this.requireAdmin(
      this.dataSource.manager,
      userId,
    );

    return this.dataSource
      .getRepository(MenuItem)
      .createQueryBuilder('item')
      .where('item.isAvailable = :available', {
        available: true,
      })
      .andWhere(
        'item.stockQuantity <= item.minimumStockLevel',
      )
      .orderBy('item.stockQuantity', 'ASC')
      .addOrderBy('item.menuItemId', 'ASC')
      .getMany();
  }


  async restockProduct(
    id: number,
    body: Record<string, unknown>,
    userId: number,
  ) {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      throw new BadRequestException(
        'A valid restock request is required.',
      );
    }

    const fields = Object.keys(body);

    if (
      fields.length !== 1 ||
      fields[0] !== 'quantity'
    ) {
      throw new BadRequestException(
        'Provide only the quantity field.',
      );
    }

    const quantity = body.quantity;

    if (
      typeof quantity !== 'number' ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > 2147483647
    ) {
      throw new BadRequestException(
        'Restock quantity must be a positive integer.',
      );
    }

    // Use a transaction to prevent concurrent
    // inventory changes from overwriting stock.
    return this.dataSource.transaction(
      async (manager) => {
        await this.requireAdmin(manager, userId);

        // Lock the product row before updating it.
        const product = await manager
          .getRepository(MenuItem)
          .findOne({
            where: {
              menuItemId: id,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          });

        if (!product) {
          throw new NotFoundException(
            `Menu item with ID ${id} was not found.`,
          );
        }

        const previousStock = product.stockQuantity;

        const updatedStock =
          previousStock + quantity;

        if (
          !Number.isSafeInteger(updatedStock) ||
          updatedStock > 2147483647
        ) {
          throw new ConflictException(
            'Restocked quantity exceeds the permitted limit.',
          );
        }

        product.stockQuantity = updatedStock;

        await manager.save(MenuItem, product);

        return {
          menuItemId: product.menuItemId,
          itemName: product.itemName,
          previousStock,
          addedQuantity: quantity,
          stockQuantity: product.stockQuantity,
          minimumStockLevel: product.minimumStockLevel,
          isAvailable: product.isAvailable,
        };
      },
    );
  }
}
