import { Module } from '@nestjs/common';
import { PoolController } from './pool.controller';
import { PoolService } from './pool.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PoolController],
  providers: [PoolService, PrismaService],
  exports: [PoolService],
})
export class PoolModule {}
