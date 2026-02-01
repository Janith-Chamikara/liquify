import type { User } from '@clerk/backend';
import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('me')
  async getProfile() {
    return 'user';
  }
}
