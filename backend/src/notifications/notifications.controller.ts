
import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest {
  user: {
    userId: number;
    role: string;
  };
}

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}


  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.findAllForUser(
      request.user.userId,
    );
  }


  @Get('unread-count')
  getUnreadCount(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.getUnreadCount(
      request.user.userId,
    );
  }


  @Patch('read-all')
  markAllAsRead(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAllAsRead(
      request.user.userId,
    );
  }


  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAsRead(
      id,
      request.user.userId,
    );
  }
}
