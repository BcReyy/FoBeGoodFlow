
import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;
}
