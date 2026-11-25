import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { AdminGuard } from '../menu-items/admin.guard';
import { AdminAccountsService } from './admin-accounts.service';

const user: User = {
  userId: 7,
  fullName: 'Example Customer',
  email: 'example@example.com',
  passwordHash: 'argon2id-stored-hash',
  role: 'Customer',
  isActive: true,
  createdAt: new Date('2026-11-01T00:00:00Z'),
};

describe('Admin Accounts security', () => {
  it('rejects a non-admin role', () => {
    const request = { user: { userId: 7, role: 'Customer' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };
    expect(() => new AdminGuard().canActivate(context as never))
      .toThrow(ForbiddenException);
  });

  it('does not expose password hashes when listing accounts', async () => {
    const repository = { find: jest.fn().mockResolvedValue([user]) };
    const dataSource = { getRepository: jest.fn().mockReturnValue(repository) };
    const service = new AdminAccountsService(dataSource as unknown as DataSource);
    const response = await service.list();
    expect(response).toEqual([{
      userId: 7,
      fullName: 'Example Customer',
      email: 'example@example.com',
      role: 'Customer',
      isActive: true,
      createdAt: user.createdAt,
    }]);
    expect(JSON.stringify(response)).not.toContain('passwordHash');
  });

  it('rejects duplicate staff email addresses before hashing or saving', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(user),
      create: jest.fn(),
      save: jest.fn(),
    };
    const dataSource = { getRepository: jest.fn().mockReturnValue(repository) };
    const service = new AdminAccountsService(dataSource as unknown as DataSource);
    await expect(service.createStaff({
      fullName: 'Example Cashier',
      email: 'Example@Example.Com',
      password: 'initial-password-123',
    })).rejects.toThrow(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('prevents changing administrator status', async () => {
    const admin: User = { ...user, role: 'Admin', userId: 1 };
    const repository = { findOne: jest.fn().mockResolvedValue(admin), save: jest.fn() };
    const manager = { getRepository: jest.fn().mockReturnValue(repository) };
    const dataSource = {
      transaction: jest.fn((work: (value: typeof manager) => Promise<unknown>) => work(manager)),
    };
    const service = new AdminAccountsService(dataSource as unknown as DataSource);
    await expect(service.updateStatus(1, false, 1)).rejects.toThrow(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
