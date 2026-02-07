import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class RecordSwapDto {
  @IsString()
  poolAddress: string;

  @IsNumber()
  tokenAReserve: number;

  @IsNumber()
  tokenBReserve: number;

  @IsString()
  txSignature: string;
}

export class RecordPriceDto {
  @IsString()
  poolAddress: string;

  @IsNumber()
  tokenAReserve: number;

  @IsNumber()
  tokenBReserve: number;

  @IsString()
  @IsOptional()
  txSignature?: string;

  @IsString()
  @IsIn(['swap', 'deposit', 'withdraw', 'init'])
  txType: 'swap' | 'deposit' | 'withdraw' | 'init';
}

export class AddLiquidityDto {
  @IsString()
  poolAddress: string;

  @IsNumber()
  amountA: number;

  @IsNumber()
  amountB: number;

  @IsNumber()
  newReserveA: number;

  @IsNumber()
  newReserveB: number;

  @IsString()
  txSignature: string;
}

export class WithdrawLiquidityDto {
  @IsString()
  poolAddress: string;

  @IsNumber()
  lpAmount: number;

  @IsNumber()
  amountA: number;

  @IsNumber()
  amountB: number;

  @IsNumber()
  newReserveA: number;

  @IsNumber()
  newReserveB: number;

  @IsString()
  txSignature: string;
}
