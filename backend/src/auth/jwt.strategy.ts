
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { User } from '../entities/user.entity';

interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthenticatedUser {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>(
        'JWT_SECRET',
      ),
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<AuthenticatedUser> {
    if (!Number.isInteger(payload.sub)) {
      throw new UnauthorizedException();
    }

    const user = await this.users.findOne({
      where: { userId: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }
}
