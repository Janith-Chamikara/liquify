import {
  IsString,
  IsInt,
  IsOptional,
  IsUrl,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class CreateTokenDto {
  @IsString()
  @IsNotEmpty()
  mintAddress: string;

  @IsString()
  @IsNotEmpty()
  creatorWallet: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsNotEmpty()
  supply: number;

  @IsInt()
  @Min(0)
  @Max(9)
  decimals: number;

  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Twitter must be a valid URL' })
  twitter?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Telegram must be a valid URL' })
  telegram?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Discord must be a valid URL' })
  discord?: string;
}
