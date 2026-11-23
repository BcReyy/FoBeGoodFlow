
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';


export class CreateMenuItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  itemName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @IsString()
  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message: 'Price must be a valid decimal with up to 2 decimal places.',
  })
  price!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStockLevel?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}


export class UpdateMenuItemDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  itemName?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message: 'Price must be a valid decimal with up to 2 decimal places.',
  })
  price?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  minimumStockLevel?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isAvailable?: boolean;
}
