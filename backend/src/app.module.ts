
import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { User } from './entities/user.entity';
import { MenuItem } from './entities/menu-item.entity';
import { UserProfile } from './entities/user-profile.entity';
import { CustomerOrder } from './entities/customer-order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Notification } from './entities/notification.entity';

import { AuthModule } from './auth/auth.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AdminAccountsModule } from './admin-accounts/admin-accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,

        host: config.getOrThrow<string>('DB_HOST'),

        port: Number(
          config.getOrThrow<string>('DB_PORT'),
        ),

        username: config.getOrThrow<string>('DB_USER'),

        password: config.getOrThrow<string>('DB_PASSWORD'),

        database: config.getOrThrow<string>('DB_NAME'),

        entities: [
          User,
          MenuItem,
          UserProfile,
          CustomerOrder,
          OrderDetail,
          Notification,
        ],

        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    AuthModule,
    MenuItemsModule,
    OrdersModule,
    NotificationsModule,
    ProfilesModule,
    AdminAccountsModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
