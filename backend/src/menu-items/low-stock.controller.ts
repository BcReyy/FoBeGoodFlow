
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { LowStockInventoryService } from './low-stock.service';

interface AuthenticatedRequest {
  user: {
    userId: number;
    role: string;
  };
}

@Controller('menu-items')
@UseGuards(AuthGuard('jwt'))
export class LowStockInventoryController {
  constructor(
    private readonly lowStockInventoryService:
      LowStockInventoryService,
  ) {}


  @Get('low-stock')
  getLowStockProducts(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.lowStockInventoryService
      .getLowStockProducts(request.user.userId);
  }


  @Patch(':id/restock')
  restockProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.lowStockInventoryService.restockProduct(
      id,
      body,
      request.user.userId,
    );
  }
}
