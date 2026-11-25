import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';

import { User } from '../entities/user.entity';
import { CreateStaffDto } from './create-staff.dto';

@Injectable()
export class AdminAccountsService {
  constructor(private readonly dataSource: DataSource) {}

  // Explicitly select response fields; never serialize the User's passwordHash.
  private present(user: User) {
    return {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.isActive),
      createdAt: user.createdAt,
    };
  }

  async list() {
    const users = await this.dataSource.getRepository(User).find({
      order: { createdAt: 'DESC', userId: 'DESC' },
    });
    return users.map((user) => this.present(user));
  }

  async createStaff(dto: CreateStaffDto) {
    const fullName = dto.fullName.trim();
    const email = dto.email.trim().toLowerCase();

    if (fullName.length < 2 || fullName.length > 100) {
      throw new BadRequestException('Full name must contain 2 to 100 characters.');
    }

    // Only the Cashier role can be created from this endpoint.
    const users = this.dataSource.getRepository(User);
    if (await users.findOne({ where: { email } })) {
      throw new ConflictException('Email address is already registered.');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = users.create({
      fullName,
      email,
      passwordHash,
      role: 'Cashier',
      isActive: true,
      createdAt: new Date(),
    });

    try {
      return this.present(await users.save(user));
    } catch (error) {
      if ((error as { code?: string })?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Email address is already registered.');
      }
      throw error;
    }
  }

  async updateStatus(id: number, isActive: boolean, actorId: number) {
    if (!Number.isSafeInteger(id) || id < 1 || typeof isActive !== 'boolean') {
      throw new BadRequestException('A valid user ID and active status are required.');
    }

    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await users.findOne({
        where: { userId: id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new NotFoundException('Account not found.');

      // Preserve the originally bootstrapped administrator and prevent self-lockout.
      if (user.userId === actorId || user.role === 'Admin') {
        throw new ForbiddenException('Administrator status cannot be changed here.');
      }
      if (user.role !== 'Cashier' && user.role !== 'Customer') {
        throw new ForbiddenException('This account role cannot be managed here.');
      }

      if (user.isActive !== isActive) {
        user.isActive = isActive;
        await users.save(user);
      }
      return this.present(user);
    });
  }
}
