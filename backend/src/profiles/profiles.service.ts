
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';

import { UpdateMyProfileDto } from './update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  // Never expose the password hash.

  private formatProfile(
    user: User,
    profile: UserProfile | null,
  ) {
    return {
      userId: user.userId,
      profileId: profile?.profileId ?? null,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneNumber: profile?.phoneNumber ?? null,
      address: profile?.address ?? null,
    };
  }


  private normalizeOptionalText(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string | null {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        `${fieldName} must be a string or null.`,
      );
    }

    const trimmed = value.trim();

    if (trimmed.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} must not exceed ${maxLength} characters.`,
      );
    }

    return trimmed || null;
  }


  async getMyProfile(userId: number) {
    const user = await this.dataSource
      .getRepository(User)
      .findOne({
        where: { userId },
      });

    if (!user || !user.isActive) {
      throw new ForbiddenException(
        'Your account is unavailable or inactive.',
      );
    }

    const profile = await this.dataSource
      .getRepository(UserProfile)
      .findOne({
        where: { userId },
      });

    return this.formatProfile(user, profile);
  }


  async updateMyProfile(
    userId: number,
    dto: UpdateMyProfileDto,
  ) {
    if (
      !dto ||
      typeof dto !== 'object' ||
      Array.isArray(dto)
    ) {
      throw new BadRequestException(
        'A valid profile update is required.',
      );
    }

    const allowedFields = [
      'fullName',
      'phoneNumber',
      'address',
    ];

    // Ignore optional DTO fields initialized as undefined by transformation.
    const suppliedFields = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([field]) => field);

    if (suppliedFields.length === 0) {
      throw new BadRequestException(
        'Provide at least one profile field to update.',
      );
    }

    const invalidField = suppliedFields.find(
      (field) => !allowedFields.includes(field),
    );

    if (invalidField) {
      throw new BadRequestException(
        `Updating ${invalidField} is not permitted.`,
      );
    }

    const hasFullName = suppliedFields.includes('fullName');
    const hasPhoneNumber = suppliedFields.includes('phoneNumber');
    const hasAddress = suppliedFields.includes('address');

    let fullName: string | undefined;
    let phoneNumber: string | null = null;
    let address: string | null = null;

    if (hasFullName) {
      if (typeof dto.fullName !== 'string') {
        throw new BadRequestException(
          'Full name must be a string.',
        );
      }

      const normalizedName = dto.fullName.trim();

      if (
        normalizedName.length === 0 ||
        normalizedName.length > 100
      ) {
        throw new BadRequestException(
          'Full name must contain 1 to 100 characters.',
        );
      }

      fullName = normalizedName;
    }

    if (hasPhoneNumber) {
      phoneNumber = this.normalizeOptionalText(
        dto.phoneNumber,
        'Phone number',
        20,
      );
    }

    if (hasAddress) {
      address = this.normalizeOptionalText(
        dto.address,
        'Address',
        255,
      );
    }

    // Update the User and UserProfile tables
    // within one database transaction.
    return this.dataSource.transaction(
      async (manager) => {
        const user = await manager
          .getRepository(User)
          .findOne({
            where: { userId },
            lock: {
              mode: 'pessimistic_write',
            },
          });

        if (!user || !user.isActive) {
          throw new ForbiddenException(
            'Your account is unavailable or inactive.',
          );
        }

        if (hasFullName && fullName !== undefined) {
          user.fullName = fullName;

          await manager.save(User, user);
        }

        let profile = await manager
          .getRepository(UserProfile)
          .findOne({
            where: { userId },
          });

        if (hasPhoneNumber || hasAddress) {
          if (!profile) {
            profile = manager.create(UserProfile, {
              userId,
              phoneNumber: null,
              address: null,
            });
          }

          if (hasPhoneNumber) {
            profile.phoneNumber = phoneNumber;
          }

          if (hasAddress) {
            profile.address = address;
          }

          profile = await manager.save(
            UserProfile,
            profile,
          );
        }

        return this.formatProfile(user, profile);
      },
    );
  }
}
