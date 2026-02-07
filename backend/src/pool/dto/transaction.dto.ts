import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class RecordTransactionDto {
  @IsString()
  txSignature: string;

  @IsString()
  @IsIn(['swap', 'deposit', 'withdraw', 'create_token', 'create_pool'])
  txType: 'swap' | 'deposit' | 'withdraw' | 'create_token' | 'create_pool';

  @IsString()
  walletAddress: string;

  @IsString()
  @IsOptional()
  poolAddress?: string;

  // For swaps
  @IsString()
  @IsOptional()
  tokenInMint?: string;

  @IsString()
  @IsOptional()
  tokenOutMint?: string;

  @IsString()
  @IsOptional()
  tokenInSymbol?: string;

  @IsString()
  @IsOptional()
  tokenOutSymbol?: string;

  @IsNumber()
  @IsOptional()
  amountIn?: number;

  @IsNumber()
  @IsOptional()
  amountOut?: number;

  // For deposits/withdrawals
  @IsNumber()
  @IsOptional()
  tokenAAmount?: number;

  @IsNumber()
  @IsOptional()
  tokenBAmount?: number;

  @IsNumber()
  @IsOptional()
  lpAmount?: number;

  // For token creation
  @IsString()
  @IsOptional()
  tokenMint?: string;

  @IsString()
  @IsOptional()
  tokenName?: string;

  @IsString()
  @IsOptional()
  tokenSymbol?: string;
}

export class GetTransactionsQueryDto {
  @IsString()
  @IsOptional()
  @IsIn(['swap', 'deposit', 'withdraw', 'create_token', 'create_pool'])
  txType?: string;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;
}
