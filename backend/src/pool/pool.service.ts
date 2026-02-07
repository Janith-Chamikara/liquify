import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePoolDto } from './dto/create-pool.dto';

@Injectable()
export class PoolService {
  constructor(private prisma: PrismaService) {}

  async createPool(data: CreatePoolDto) {
    // Verify both tokens exist
    const tokenA = await this.prisma.token.findUnique({
      where: { mintAddress: data.tokenAMint },
    });

    const tokenB = await this.prisma.token.findUnique({
      where: { mintAddress: data.tokenBMint },
    });

    if (!tokenA || !tokenB) {
      throw new BadRequestException(
        'One or both tokens do not exist in the database',
      );
    }

    // Check if pool already exists for this pair
    const existingPool = await this.prisma.liquidityPool.findFirst({
      where: {
        OR: [
          { tokenAMint: data.tokenAMint, tokenBMint: data.tokenBMint },
          { tokenAMint: data.tokenBMint, tokenBMint: data.tokenAMint },
        ],
      },
    });

    if (existingPool) {
      throw new BadRequestException(
        'A liquidity pool already exists for this token pair',
      );
    }

    const pool = await this.prisma.liquidityPool.create({
      data: {
        poolAddress: data.poolAddress,
        tokenAMint: data.tokenAMint,
        tokenBMint: data.tokenBMint,
        lpMintAddress: data.lpMintAddress,
        vaultAAddress: data.vaultAAddress,
        vaultBAddress: data.vaultBAddress,
        tokenAReserve: data.initialTokenAAmount,
        tokenBReserve: data.initialTokenBAmount,
        lpTotalSupply: Math.sqrt(
          data.initialTokenAAmount * data.initialTokenBAmount,
        ),
        creatorWallet: data.creatorWallet,
        txSignature: data.txSignature,
      },
      include: {
        tokenA: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
          },
        },
        tokenB: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
          },
        },
      },
    });

    // Record initial price in price history
    const initialPrice =
      data.initialTokenAAmount > 0
        ? data.initialTokenBAmount / data.initialTokenAAmount
        : 0;

    await this.prisma.priceHistory.create({
      data: {
        poolId: pool.id,
        price: initialPrice,
        tokenAReserve: data.initialTokenAAmount,
        tokenBReserve: data.initialTokenBAmount,
        txSignature: data.txSignature,
        txType: 'init',
      },
    });

    return {
      pool,
      message: 'Liquidity pool created successfully!',
    };
  }

  async getUserPools(walletAddress: string) {
    return this.prisma.liquidityPool.findMany({
      where: {
        creatorWallet: walletAddress,
      },
      include: {
        tokenA: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
            decimals: true,
          },
        },
        tokenB: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
            decimals: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllPools() {
    return this.prisma.liquidityPool.findMany({
      include: {
        tokenA: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
            decimals: true,
          },
        },
        tokenB: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
            decimals: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPoolByAddress(poolAddress: string) {
    return this.prisma.liquidityPool.findUnique({
      where: { poolAddress },
      include: {
        tokenA: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
            decimals: true,
          },
        },
        tokenB: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
            decimals: true,
          },
        },
      },
    });
  }

  async getPoolByTokenPair(tokenAMint: string, tokenBMint: string) {
    return this.prisma.liquidityPool.findFirst({
      where: {
        OR: [
          { tokenAMint, tokenBMint },
          { tokenAMint: tokenBMint, tokenBMint: tokenAMint },
        ],
      },
      include: {
        tokenA: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
            decimals: true,
          },
        },
        tokenB: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
            decimals: true,
          },
        },
      },
    });
  }

  async updatePoolReserves(
    poolAddress: string,
    tokenAReserve: number,
    tokenBReserve: number,
    lpTotalSupply: number,
  ) {
    return this.prisma.liquidityPool.update({
      where: { poolAddress },
      data: {
        tokenAReserve,
        tokenBReserve,
        lpTotalSupply,
      },
    });
  }

  async addLiquidity(data: {
    poolAddress: string;
    amountA: number;
    amountB: number;
    newReserveA: number;
    newReserveB: number;
    txSignature: string;
  }) {
    const pool = await this.prisma.liquidityPool.findUnique({
      where: { poolAddress: data.poolAddress },
    });

    if (!pool) {
      throw new BadRequestException('Pool not found');
    }

    // Calculate new LP supply (proportional increase)
    const shareIncrease = data.amountA / pool.tokenAReserve;
    const newLpSupply = pool.lpTotalSupply * (1 + shareIncrease);

    // Update pool reserves
    await this.prisma.liquidityPool.update({
      where: { poolAddress: data.poolAddress },
      data: {
        tokenAReserve: data.newReserveA,
        tokenBReserve: data.newReserveB,
        lpTotalSupply: newLpSupply,
      },
    });

    // Record price history
    await this.recordPriceHistory({
      poolAddress: data.poolAddress,
      tokenAReserve: data.newReserveA,
      tokenBReserve: data.newReserveB,
      txSignature: data.txSignature,
      txType: 'deposit',
    });

    return {
      success: true,
      message: 'Liquidity added successfully',
      newReserveA: data.newReserveA,
      newReserveB: data.newReserveB,
      newLpSupply,
    };
  }

  async withdrawLiquidity(data: {
    poolAddress: string;
    lpAmount: number;
    amountA: number;
    amountB: number;
    newReserveA: number;
    newReserveB: number;
    txSignature: string;
  }) {
    const pool = await this.prisma.liquidityPool.findUnique({
      where: { poolAddress: data.poolAddress },
    });

    if (!pool) {
      throw new BadRequestException('Pool not found');
    }

    // Calculate new LP supply (decrease)
    const newLpSupply = pool.lpTotalSupply - data.lpAmount;

    // Update pool reserves
    await this.prisma.liquidityPool.update({
      where: { poolAddress: data.poolAddress },
      data: {
        tokenAReserve: data.newReserveA,
        tokenBReserve: data.newReserveB,
        lpTotalSupply: Math.max(0, newLpSupply),
      },
    });

    // Record price history
    await this.recordPriceHistory({
      poolAddress: data.poolAddress,
      tokenAReserve: data.newReserveA,
      tokenBReserve: data.newReserveB,
      txSignature: data.txSignature,
      txType: 'withdraw',
    });

    return {
      success: true,
      message: 'Liquidity withdrawn successfully',
      amountA: data.amountA,
      amountB: data.amountB,
      newReserveA: data.newReserveA,
      newReserveB: data.newReserveB,
      newLpSupply: Math.max(0, newLpSupply),
    };
  }

  // Price History Methods

  async recordPriceHistory(data: {
    poolAddress: string;
    tokenAReserve: number;
    tokenBReserve: number;
    txSignature?: string;
    txType: 'swap' | 'deposit' | 'withdraw' | 'init';
  }) {
    const pool = await this.prisma.liquidityPool.findUnique({
      where: { poolAddress: data.poolAddress },
    });

    if (!pool) {
      throw new BadRequestException('Pool not found');
    }

    // Calculate price: Token A price in terms of Token B
    const price =
      data.tokenAReserve > 0 ? data.tokenBReserve / data.tokenAReserve : 0;

    return this.prisma.priceHistory.create({
      data: {
        poolId: pool.id,
        price,
        tokenAReserve: data.tokenAReserve,
        tokenBReserve: data.tokenBReserve,
        txSignature: data.txSignature,
        txType: data.txType,
      },
    });
  }

  async getPriceHistory(
    poolAddress: string,
    timeRange: '1H' | '24H' | '7D' | '30D' | 'ALL' = '24H',
  ) {
    const pool = await this.prisma.liquidityPool.findUnique({
      where: { poolAddress },
    });

    if (!pool) {
      throw new BadRequestException('Pool not found');
    }

    // Calculate time filter based on range
    let startTime: Date;
    const now = new Date();

    switch (timeRange) {
      case '1H':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24H':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7D':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30D':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'ALL':
      default:
        startTime = new Date(0); // Beginning of time
        break;
    }

    const priceHistory = await this.prisma.priceHistory.findMany({
      where: {
        poolId: pool.id,
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        price: true,
        tokenAReserve: true,
        tokenBReserve: true,
        txType: true,
        timestamp: true,
      },
    });

    // Calculate price change
    let priceChange = { value: 0, percent: 0 };
    if (priceHistory.length >= 2) {
      const firstPrice = priceHistory[0].price;
      const lastPrice = priceHistory[priceHistory.length - 1].price;
      const change = lastPrice - firstPrice;
      const percent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
      priceChange = { value: change, percent };
    }

    return {
      poolAddress,
      timeRange,
      priceHistory,
      priceChange,
      currentPrice:
        priceHistory.length > 0
          ? priceHistory[priceHistory.length - 1].price
          : pool.tokenAReserve > 0
            ? pool.tokenBReserve / pool.tokenAReserve
            : 0,
    };
  }

  async recordSwap(data: {
    poolAddress: string;
    tokenAReserve: number;
    tokenBReserve: number;
    txSignature: string;
  }) {
    // Update pool reserves
    await this.updatePoolReserves(
      data.poolAddress,
      data.tokenAReserve,
      data.tokenBReserve,
      0, // LP supply doesn't change on swap
    );

    // Record price history
    return this.recordPriceHistory({
      poolAddress: data.poolAddress,
      tokenAReserve: data.tokenAReserve,
      tokenBReserve: data.tokenBReserve,
      txSignature: data.txSignature,
      txType: 'swap',
    });
  }

  // Transaction History Methods
  async recordTransaction(data: {
    txSignature: string;
    txType: 'swap' | 'deposit' | 'withdraw' | 'create_token' | 'create_pool';
    walletAddress: string;
    poolAddress?: string;
    tokenInMint?: string;
    tokenOutMint?: string;
    tokenInSymbol?: string;
    tokenOutSymbol?: string;
    amountIn?: number;
    amountOut?: number;
    tokenAAmount?: number;
    tokenBAmount?: number;
    lpAmount?: number;
    tokenMint?: string;
    tokenName?: string;
    tokenSymbol?: string;
  }) {
    return this.prisma.transaction.create({
      data: {
        txSignature: data.txSignature,
        txType: data.txType,
        walletAddress: data.walletAddress,
        poolAddress: data.poolAddress,
        tokenInMint: data.tokenInMint,
        tokenOutMint: data.tokenOutMint,
        tokenInSymbol: data.tokenInSymbol,
        tokenOutSymbol: data.tokenOutSymbol,
        amountIn: data.amountIn,
        amountOut: data.amountOut,
        tokenAAmount: data.tokenAAmount,
        tokenBAmount: data.tokenBAmount,
        lpAmount: data.lpAmount,
        tokenMint: data.tokenMint,
        tokenName: data.tokenName,
        tokenSymbol: data.tokenSymbol,
        status: 'confirmed',
      },
    });
  }

  async getTransactionsByWallet(
    walletAddress: string,
    options?: {
      txType?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { walletAddress };

    if (options?.txType) {
      where.txType = options.txType;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      hasMore: (options?.offset || 0) + transactions.length < total,
    };
  }

  async getRecentTransactions(limit: number = 20) {
    return this.prisma.transaction.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
