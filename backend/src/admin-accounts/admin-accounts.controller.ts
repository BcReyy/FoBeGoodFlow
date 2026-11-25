import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { AdminGuard } from '../menu-items/admin.guard';
import { AdminAccountsService } from './admin-accounts.service';
import { CreateStaffDto } from './create-staff.dto';
import { UpdateAccountStatusDto } from './update-account-status.dto';

@Controller('admin/accounts')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminAccountsController {
  constructor(private readonly accounts: AdminAccountsService) {}

  @Get()
  list() {
    return this.accounts.list();
  }

  @Post('staff')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.accounts.createStaff(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountStatusDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.accounts.updateStatus(id, dto.isActive, request.user.userId);
  }
}
