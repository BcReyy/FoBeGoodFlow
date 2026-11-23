
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';
import { UpdateOrderStatusDto } from './update-order-status.dto';

interface AuthenticatedRequest {
  user: {
    userId: number;
    role: string;
  };
}

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}


  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersService.create(
      dto,
      request.user.userId,
    );
  }


  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersService.findAllForUser(
      request.user.userId,
      request.user.role,
    );
  }


  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersService.findOneForUser(
      id,
      request.user.userId,
      request.user.role,
    );
  }


  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersService.updateStatus(
      id,
      dto,
      request.user.userId,
    );
  }
}
