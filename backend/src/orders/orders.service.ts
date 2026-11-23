import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  DataSource,
  In,
  type FindOptionsWhere,
} from 'typeorm';

import { randomUUID } from 'crypto';

import { CustomerOrder } from '../entities/customer-order.entity';
import { OrderDetail } from '../entities/order-detail.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { User } from '../entities/user.entity';
import { LowStockAlertsService } from '../notifications/low-stock-alerts.service';

import { CreateOrderDto } from './create-order.dto';
import { UpdateOrderStatusDto } from './update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly lowStockAlertsService: LowStockAlertsService,
  ) {}


  private toCentavos(price: string): number {
    const value = String(price);

    const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(value);

    if (!match) {
      throw new BadRequestException(
        'Invalid product price in database.',
      );
    }

    const pesos = Number(match[1]);

    const centavos = Number(
      (match[2] ?? '').padEnd(2, '0'),
    );

    return pesos * 100 + centavos;
  }


  private toMoney(centavos: number): string {
    const pesos = Math.floor(centavos / 100);

    const cents = String(
      centavos % 100,
    ).padStart(2, '0');

    return `${pesos}.${cents}`;
  }


  async create(
    dto: CreateOrderDto,
    operatorId: number,
  ) {
    const productIds = dto.items.map(
      (item) => item.menuItemId,
    );

    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException(
        'Duplicate menu items are not allowed in one order.',
      );
    }

    // All database operations use one transaction.
    return this.dataSource.transaction(async (manager) => {
      const operator = await manager.findOne(User, {
        where: {
          userId: operatorId,
        },
      });

      if (
        !operator ||
        !operator.isActive ||
        !['Admin', 'Cashier'].includes(operator.role)
      ) {
        throw new ForbiddenException(
          'Only active Admin or Cashier accounts can process orders.',
        );
      }

      let customerId: number | null = null;

      if (dto.customerId != null) {
        const customer = await manager.findOne(User, {
          where: {
            userId: dto.customerId,
          },
        });

        if (
          !customer ||
          !customer.isActive ||
          customer.role !== 'Customer'
        ) {
          throw new BadRequestException(
            'A valid active Customer account is required.',
          );
        }

        customerId = customer.userId;
      }

      let totalCentavos = 0;

      const orderLines: {
        menuItemId: number;
        quantity: number;
        unitPrice: string;
        subtotal: string;
      }[] = [];

      // Lock products in a consistent order.
      const sortedItems = [...dto.items].sort(
        (a, b) => a.menuItemId - b.menuItemId,
      );

      for (const requested of sortedItems) {
        const product = await manager
          .getRepository(MenuItem)
          .findOne({
            where: {
              menuItemId: requested.menuItemId,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          });

        if (!product || !product.isAvailable) {
          throw new BadRequestException(
            `Product ${requested.menuItemId} is unavailable.`,
          );
        }

        if (
          !Number.isSafeInteger(requested.quantity) ||
          requested.quantity < 1
        ) {
          throw new BadRequestException(
            'Product quantity must be a positive integer.',
          );
        }

        if (product.stockQuantity < requested.quantity) {
          throw new ConflictException(
            `Insufficient stock for ${product.itemName}.`,
          );
        }

        const unitCentavos = this.toCentavos(
          product.price,
        );

        const subtotalCentavos =
          unitCentavos * requested.quantity;

        totalCentavos += subtotalCentavos;

        if (
          !Number.isSafeInteger(totalCentavos) ||
          totalCentavos > 9999999999
        ) {
          throw new BadRequestException(
            'Order total exceeds the allowed amount.',
          );
        }

        const wasLowStock =
          product.stockQuantity <= product.minimumStockLevel;

        product.stockQuantity -= requested.quantity;

        await manager.save(MenuItem, product);

        // Notify active Admins only if this sale newly crosses
        // into low-stock status. Failure rolls back the entire order.
        await this.lowStockAlertsService.notifyOnLowStockTransition(
          manager,
          product,
          wasLowStock,
        );

        orderLines.push({
          menuItemId: product.menuItemId,
          quantity: requested.quantity,
          unitPrice: this.toMoney(unitCentavos),
          subtotal: this.toMoney(subtotalCentavos),
        });
      }

      const orderNumber =
        `ORD-${randomUUID()
          .replace(/-/g, '')
          .slice(0, 24)
          .toUpperCase()}`;

      const order = manager.create(CustomerOrder, {
        orderNumber,
        customerId,
        cashierId: operatorId,
        orderDate: new Date(),
        orderStatus: 'Pending',
        totalAmount: this.toMoney(totalCentavos),
      });

      const savedOrder = await manager.save(
        CustomerOrder,
        order,
      );

      const details = orderLines.map((line) =>
        manager.create(OrderDetail, {
          orderId: savedOrder.orderId,
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          subtotal: line.subtotal,
        }),
      );

      await manager.save(OrderDetail, details);

      return {
        orderId: savedOrder.orderId,
        orderNumber: savedOrder.orderNumber,
        customerId: savedOrder.customerId,
        cashierId: savedOrder.cashierId,
        orderStatus: savedOrder.orderStatus,
        totalAmount: savedOrder.totalAmount,
        items: orderLines,
      };
    });
  }


  async findAllForUser(
    userId: number,
    role: string,
  ) {
    let where: FindOptionsWhere<CustomerOrder>;

    if (role === 'Admin') {
      where = {};
    } else if (role === 'Cashier') {
      where = {
        cashierId: userId,
      };
    } else if (role === 'Customer') {
      where = {
        customerId: userId,
      };
    } else {
      throw new ForbiddenException(
        'You do not have permission to view orders.',
      );
    }

    const orders = await this.dataSource
      .getRepository(CustomerOrder)
      .find({
        where,
        order: {
          orderDate: 'DESC',
          orderId: 'DESC',
        },
      });

    if (orders.length === 0) {
      return [];
    }

    const details = await this.dataSource
      .getRepository(OrderDetail)
      .find({
        where: {
          orderId: In(
            orders.map((order) => order.orderId),
          ),
        },
        order: {
          orderDetailId: 'ASC',
        },
      });

    return orders.map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      cashierId: order.cashierId,
      orderDate: order.orderDate,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,

      items: details
        .filter(
          (detail) => detail.orderId === order.orderId,
        )
        .map((detail) => ({
          orderDetailId: detail.orderDetailId,
          menuItemId: detail.menuItemId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          subtotal: detail.subtotal,
        })),
    }));
  }


  async findOneForUser(
    orderId: number,
    userId: number,
    role: string,
  ) {
    let where: FindOptionsWhere<CustomerOrder>;

    if (role === 'Admin') {
      where = {
        orderId,
      };
    } else if (role === 'Cashier') {
      where = {
        orderId,
        cashierId: userId,
      };
    } else if (role === 'Customer') {
      where = {
        orderId,
        customerId: userId,
      };
    } else {
      throw new ForbiddenException(
        'You do not have permission to view orders.',
      );
    }

    const order = await this.dataSource
      .getRepository(CustomerOrder)
      .findOne({
        where,
      });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${orderId} was not found.`,
      );
    }

    const details = await this.dataSource
      .getRepository(OrderDetail)
      .find({
        where: {
          orderId,
        },
        order: {
          orderDetailId: 'ASC',
        },
      });

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      cashierId: order.cashierId,
      orderDate: order.orderDate,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,

      items: details.map((detail) => ({
        orderDetailId: detail.orderDetailId,
        menuItemId: detail.menuItemId,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        subtotal: detail.subtotal,
      })),
    };
  }


  async updateStatus(
    orderId: number,
    dto: UpdateOrderStatusDto,
    operatorId: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const operator = await manager.findOne(User, {
        where: {
          userId: operatorId,
        },
      });

      if (
        !operator ||
        !operator.isActive ||
        !['Admin', 'Cashier'].includes(operator.role)
      ) {
        throw new ForbiddenException(
          'Only active Admin or Cashier accounts can update order status.',
        );
      }

      // Lock the order to prevent simultaneous changes.
      // Cashiers can modify only orders they processed.
      const order = await manager
        .getRepository(CustomerOrder)
        .findOne({
          where:
            operator.role === 'Cashier'
              ? {
                  orderId,
                  cashierId: operatorId,
                }
              : {
                  orderId,
                },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!order) {
        throw new NotFoundException(
          `Order with ID ${orderId} was not found.`,
        );
      }

      // Only Pending orders may change status.
      if (order.orderStatus !== 'Pending') {
        throw new ConflictException(
          'Only Pending orders can be completed or cancelled.',
        );
      }

      if (
        dto.status !== 'Completed' &&
        dto.status !== 'Cancelled'
      ) {
        throw new BadRequestException(
          'Invalid order status.',
        );
      }


      if (dto.status === 'Cancelled') {
        const details = await manager
          .getRepository(OrderDetail)
          .find({
            where: {
              orderId,
            },
            order: {
              menuItemId: 'ASC',
              orderDetailId: 'ASC',
            },
          });

        if (details.length === 0) {
          throw new ConflictException(
            'Cannot cancel an order without order details.',
          );
        }

        for (const detail of details) {
          if (
            !Number.isSafeInteger(detail.quantity) ||
            detail.quantity < 1
          ) {
            throw new ConflictException(
              'Invalid order detail quantity.',
            );
          }

          // Lock the product before restoring inventory.
          const product = await manager
            .getRepository(MenuItem)
            .findOne({
              where: {
                menuItemId: detail.menuItemId,
              },
              lock: {
                mode: 'pessimistic_write',
              },
            });

          if (!product) {
            throw new ConflictException(
              `Product ${detail.menuItemId} could not be restored.`,
            );
          }

          const restoredStock =
            product.stockQuantity + detail.quantity;

          if (
            !Number.isSafeInteger(restoredStock) ||
            restoredStock < 0 ||
            restoredStock > 2147483647
          ) {
            throw new ConflictException(
              'Restored stock exceeds the permitted limit.',
            );
          }

          product.stockQuantity = restoredStock;

          await manager.save(MenuItem, product);
        }
      }


      order.orderStatus = dto.status;

      await manager.save(CustomerOrder, order);

      return {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        customerId: order.customerId,
        cashierId: order.cashierId,
        totalAmount: order.totalAmount,
        stockRestored: dto.status === 'Cancelled',
      };
    });
  }
}
