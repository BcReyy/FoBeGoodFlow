
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';

import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
    ]),
  ],

  controllers: [
    ProfilesController,
  ],

  providers: [
    ProfilesService,
  ],
})
export class ProfilesModule {}
