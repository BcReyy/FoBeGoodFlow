
import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { ProfilesService } from './profiles.service';
import { UpdateMyProfileDto } from './update-profile.dto';

interface AuthenticatedRequest {
  user: {
    userId: number;
    role: string;
  };
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
  ) {}


  @Get('me/profile')
  getMyProfile(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.profilesService.getMyProfile(
      request.user.userId,
    );
  }


  @Patch('me/profile')
  updateMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.profilesService.updateMyProfile(
      request.user.userId,
      dto,
    );
  }
}
