
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();

    if (fullName.length < 2) {
      throw new BadRequestException(
        'Full name must contain at least 2 characters.',
      );
    }

    const existingUser = await this.users.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email address is already registered.',
      );
    }

    const passwordHash = await argon2.hash(
      dto.password,
      { type: argon2.argon2id },
    );

    const user = this.users.create({
      fullName,
      email,
      passwordHash,
      role: 'Customer',
      isActive: true,
      createdAt: new Date(),
    });

    try {
      const saved = await this.users.save(user);

      return {
        userId: saved.userId,
        fullName: saved.fullName,
        email: saved.email,
        role: saved.role,
      };
    } catch (error) {
      if (
        (error as { code?: string })?.code ===
        'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'Email address is already registered.',
        );
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.users.findOne({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const passwordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      email: user.email,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }
}
