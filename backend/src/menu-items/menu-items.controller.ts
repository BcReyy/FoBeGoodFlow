
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { MenuItemsService } from './menu-items.service';
import { AdminGuard } from './admin.guard';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './menu-item.dto';

@Controller('menu-items')
@UseGuards(AuthGuard('jwt'))
export class MenuItemsController {
  constructor(
    private readonly menuItemsService: MenuItemsService,
  ) {}

  @Get()

  findAll(
  @Req() request: { user: { role: string } },
  ) {
  const isAdmin = request.user.role === 'Admin';

  return this.menuItemsService.findAll(isAdmin);
  }

  
  // Admin can view inactive items.
  // Customer and Cashier can view active items only.
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: { user: { role: string } },
  ) {
    const isAdmin = request.user.role === 'Admin';

    return this.menuItemsService.findOneForViewing(
      id,
      isAdmin,
    );
  }


  @Post()
  @UseGuards(AdminGuard)
  create(
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menuItemsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItemsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.menuItemsService.deactivate(id);
  }
}
