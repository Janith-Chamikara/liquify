import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreatePoolDto {
  @IsString()
  @IsNotEmpty()
  poolAddress: string;

  @IsString()
  @IsNotEmpty()
  tokenAMint: string;

  @IsString()
  @IsNotEmpty()
  tokenBMint: string;

  @IsString()
  @IsNotEmpty()
  lpMintAddress: string;

  @IsString()
  @IsNotEmpty()
  vaultAAddress: string;

  @IsString()
  @IsNotEmpty()
  vaultBAddress: string;

  @IsNumber()
  @Min(0)
  initialTokenAAmount: number;

  @IsNumber()
  @Min(0)
  initialTokenBAmount: number;

  @IsString()
  @IsNotEmpty()
  creatorWallet: string;

  @IsString()
  @IsOptional()
  txSignature?: string;
}
