
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ name: 'UserID' })
  userId!: number;

  @Column({ name: 'FullName', type: 'varchar', length: 100 })
  fullName!: string;

  @Index('IDX_2f56f7040c2b05fc8f08a113f7', {
    unique: true,
  })
  @Column({
    name: 'Email',
    type: 'varchar',
    length: 150,
  })  
  email!: string;

  @Column({ name: 'PasswordHash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'Role', type: 'varchar', length: 20 })
  role!: string;

  @Column({ name: 'IsActive', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'CreatedAt', type: 'datetime' })
  createdAt!: Date;
}
