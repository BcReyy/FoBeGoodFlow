
import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

import { User } from './entities/user.entity';
import { MenuItem } from './entities/menu-item.entity';

import { UserProfile } from './entities/user-profile.entity';
import { CustomerOrder } from './entities/customer-order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Notification } from './entities/notification.entity';

const AppDataSource = new DataSource({
  type: 'mysql',

  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),

  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [
  User,
  MenuItem,
  UserProfile,
  CustomerOrder,
  OrderDetail,
  Notification,
],

  migrations: [
  join(__dirname, 'migrations', '*.{ts,js}')
    .replace(/\\/g, '/'),
],

  synchronize: false,
  migrationsRun: false,
  logging: false,
});

export default AppDataSource;
