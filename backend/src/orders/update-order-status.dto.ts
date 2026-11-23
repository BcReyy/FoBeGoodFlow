
import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['Completed', 'Cancelled'], {
    message: 'Status must be Completed or Cancelled.',
  })
  status!: 'Completed' | 'Cancelled';
}
