import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('userprofile')
export class UserProfile {
  @PrimaryGeneratedColumn({ name: 'ProfileID' })
  profileId!: number;

  @Column({ name: 'UserID', type: 'int' })
  userId!: number;

  @OneToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'UserID',
    referencedColumnName: 'userId',
  })
  user!: User;

  @Column({
    name: 'PhoneNumber',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phoneNumber!: string | null;

  @Column({
    name: 'Address',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  address!: string | null;
}