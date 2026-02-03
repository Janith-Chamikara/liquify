import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TokenService } from './token.service';
import { CreateTokenDto } from './dto/create-token.dto';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('create')
  async create(@Body() createTokenDto: CreateTokenDto) {
    console.log(createTokenDto);
    return await this.tokenService.createToken(createTokenDto);
  }

  @Get('user/:walletAddress')
  async getTokensByUser(@Param('walletAddress') walletAddress: string) {
    return this.tokenService.getUserTokens(walletAddress);
  }

  @Get('get-all')
  async getAllTokensHandler() {
    return this.tokenService.getAllTokens();
  }
}
