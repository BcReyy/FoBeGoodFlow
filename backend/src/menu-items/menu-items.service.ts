
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { MenuItem } from '../entities/menu-item.entity';

import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './menu-item.dto';

import { LowStockAlertsService } from
  '../notifications/low-stock-alerts.service';

@Injectable()
export class MenuItemsService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,

    private readonly dataSource: DataSource,

    private readonly lowStockAlertsService:
      LowStockAlertsService,
  ) {}


  async findAll(
    includeInactive = false,
  ): Promise<MenuItem[]> {
    return this.menuItemsRepository.find({
      where: includeInactive
        ? {}
        : { isAvailable: true },

      order: {
        menuItemId: 'ASC',
      },
    });
  }


  async findOne(id: number): Promise<MenuItem> {
    const item = await this.menuItemsRepository.findOneBy({
      menuItemId: id,
    });

    if (!item) {
      throw new NotFoundException(
        `Menu item with ID ${id} was not found.`,
      );
    }

    return item;
  }


  async findOneForViewing(
    id: number,
    includeInactive = false,
  ): Promise<MenuItem> {
    const item = await this.findOne(id);

    if (!includeInactive && !item.isAvailable) {
      throw new NotFoundException(
        `Menu item with ID ${id} was not found.`,
      );
    }

    return item;
  }


  async create(
    dto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    const itemName = dto.itemName.trim();
    const category = dto.category.trim();

    if (!itemName || !category) {
      throw new BadRequestException(
        'Item name and category cannot be empty.',
      );
    }

    // Product creation and notification creation
    // occur in the same database transaction.
    return this.dataSource.transaction(async (manager) => {
      const item = manager.create(MenuItem, {
        itemName,
        category,
        description: dto.description?.trim() || null,
        price: dto.price,
        stockQuantity: dto.stockQuantity ?? 0,
        minimumStockLevel: dto.minimumStockLevel ?? 5,
        isAvailable: dto.isAvailable ?? true,
        createdAt: new Date(),
      });

      const savedItem = await manager.save(
        MenuItem,
        item,
      );

      if (savedItem.isAvailable) {
        await this.lowStockAlertsService
          .notifyOnLowStockTransition(
            manager,
            savedItem,
            false,
          );
      }

      return savedItem;
    });
  }


  async update(
    id: number,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Provide at least one field to update.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const item = await manager
        .getRepository(MenuItem)
        .findOne({
          where: {
            menuItemId: id,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!item) {
        throw new NotFoundException(
          `Menu item with ID ${id} was not found.`,
        );
      }

      // Record the previous stock condition.
      // Inactive products are not treated as
      // currently available low-stock products.
      const wasLowStock =
        item.isAvailable &&
        item.stockQuantity <= item.minimumStockLevel;


      if (dto.itemName !== undefined) {
        const name = dto.itemName.trim();

        if (!name) {
          throw new BadRequestException(
            'Item name cannot be empty.',
          );
        }

        item.itemName = name;
      }


      if (dto.category !== undefined) {
        const category = dto.category.trim();

        if (!category) {
          throw new BadRequestException(
            'Category cannot be empty.',
          );
        }

        item.category = category;
      }


      if (dto.description !== undefined) {
        item.description =
          dto.description?.trim() || null;
      }


      if (dto.price !== undefined) {
        item.price = dto.price;
      }


      if (dto.stockQuantity !== undefined) {
        item.stockQuantity = dto.stockQuantity;
      }


      if (dto.minimumStockLevel !== undefined) {
        item.minimumStockLevel =
          dto.minimumStockLevel;
      }


      if (dto.isAvailable !== undefined) {
        item.isAvailable = dto.isAvailable;
      }

      const savedItem = await manager.save(
        MenuItem,
        item,
      );

      // Generate an alert only when an active
      // product newly enters low-stock status.
      if (savedItem.isAvailable) {
        await this.lowStockAlertsService
          .notifyOnLowStockTransition(
            manager,
            savedItem,
            wasLowStock,
          );
      }

      return savedItem;
    });
  }


  async deactivate(id: number): Promise<MenuItem> {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager
        .getRepository(MenuItem)
        .findOne({
          where: {
            menuItemId: id,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!item) {
        throw new NotFoundException(
          `Menu item with ID ${id} was not found.`,
        );
      }

      // Repeated DELETE requests remain safe.
      if (!item.isAvailable) {
        return item;
      }

      item.isAvailable = false;

      // Keep historical order references.
      return manager.save(MenuItem, item);
    });
  }
}
