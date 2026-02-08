import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { PoolService } from './pool.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import {
  RecordSwapDto,
  RecordPriceDto,
  AddLiquidityDto,
  WithdrawLiquidityDto,
} from './dto/record-swap.dto';
import { RecordTransactionDto } from './dto/transaction.dto';

@Controller('pool')
export class PoolController {
  constructor(private readonly poolService: PoolService) {}

  @Post('create')
  async create(@Body() createPoolDto: CreatePoolDto) {
    return await this.poolService.createPool(createPoolDto);
  }

  @Get('user/:walletAddress')
  async getPoolsByUser(@Param('walletAddress') walletAddress: string) {
    return this.poolService.getUserPools(walletAddress);
  }

  @Get('get-all')
  async getAllPools() {
    return this.poolService.getAllPools();
  }

  @Get('address/:poolAddress')
  async getPoolByAddress(@Param('poolAddress') poolAddress: string) {
    return this.poolService.getPoolByAddress(poolAddress);
  }

  @Get('pair')
  async getPoolByTokenPair(
    @Query('tokenA') tokenAMint: string,
    @Query('tokenB') tokenBMint: string,
  ) {
    return this.poolService.getPoolByTokenPair(tokenAMint, tokenBMint);
  }

  // Price History Endpoints

  @Get(':poolAddress/price-history')
  async getPriceHistory(
    @Param('poolAddress') poolAddress: string,
    @Query('range') timeRange: '1H' | '24H' | '7D' | '30D' | 'ALL' = '24H',
  ) {
    return this.poolService.getPriceHistory(poolAddress, timeRange);
  }

  @Post('record-swap')
  async recordSwap(@Body() recordSwapDto: RecordSwapDto) {
    return this.poolService.recordSwap(recordSwapDto);
  }

  @Post('record-price')
  async recordPrice(@Body() recordPriceDto: RecordPriceDto) {
    return this.poolService.recordPriceHistory(recordPriceDto);
  }

  @Post('add-liquidity')
  async addLiquidity(@Body() addLiquidityDto: AddLiquidityDto) {
    return this.poolService.addLiquidity(addLiquidityDto);
  }

  @Post('withdraw-liquidity')
  async withdrawLiquidity(@Body() withdrawLiquidityDto: WithdrawLiquidityDto) {
    return this.poolService.withdrawLiquidity(withdrawLiquidityDto);
  }

  // Transaction History Endpoints

  @Post('transaction')
  async recordTransaction(@Body() recordTransactionDto: RecordTransactionDto) {
    return this.poolService.recordTransaction(recordTransactionDto);
  }

  @Get('transactions/:walletAddress')
  async getTransactionsByWallet(
    @Param('walletAddress') walletAddress: string,
    @Query('txType') txType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.poolService.getTransactionsByWallet(walletAddress, {
      txType,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('transactions-recent')
  async getRecentTransactions(@Query('limit') limit?: string) {
    return this.poolService.getRecentTransactions(
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
