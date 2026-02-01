import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTokenDto } from './dto/create-token.dto';

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  async createToken(data: CreateTokenDto) {
    const token = await this.prisma.token.create({
      data: {
        mintAddress: data.mintAddress,
        name: data.name,
        symbol: data.symbol,
        imageUrl: data.imageUrl,
        description: data.description,
        supply: data.supply,
        decimals: data.decimals,
        website: data.website,
        twitter: data.twitter,
        telegram: data.telegram,
        discord: data.discord,
        creatorWallet: data.creatorWallet,
      },
    });

    if (token) {
      return {
        token,
        message: 'Congratulations! Your token has been successfully set up.',
      };
    }
  }

  async getUserTokens(walletAddress: string) {
    return this.prisma.token.findMany({
      where: {
        creator: {
          walletAddress: walletAddress,
        },
      },
    });
  }
}
