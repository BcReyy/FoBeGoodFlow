import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../entities/user.entity';
import { AdminGuard } from '../menu-items/admin.guard';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminAccountsService } from './admin-accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminAccountsController],
  providers: [AdminAccountsService, AdminGuard],
})
export class AdminAccountsModule {}
