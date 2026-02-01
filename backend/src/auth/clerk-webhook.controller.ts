import {
  Controller,
  Headers,
  Post,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { Public } from './decorators/public.decorator';
import { AuthService, type ClerkWebhookUser } from './auth.service';

type ClerkWebhookEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string;
  data: ClerkWebhookUser;
};

@Controller()
export class ClerkWebhookController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('webhooks/clerk')
  async handleClerkWebhook(
    @Req() req: Request,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    return this.processWebhook(req, svixId, svixTimestamp, svixSignature);
  }

  @Public()
  @Post('auth/webhook')
  async handleLegacyClerkWebhook(
    @Req() req: Request,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    return this.processWebhook(req, svixId, svixTimestamp, svixSignature);
  }

  private async processWebhook(
    req: Request,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ) {
    const secret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('Missing CLERK_WEBHOOK_SECRET');
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing Svix headers');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const body = req.body as Buffer | string | undefined;
    const payload =
      rawBody?.toString() ?? (Buffer.isBuffer(body) ? body.toString() : body);

    if (!payload || typeof payload !== 'string') {
      throw new BadRequestException('Missing raw body');
    }

    const wh = new Webhook(secret);

    let event: ClerkWebhookEvent;
    try {
      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (error) {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await this.authService.syncClerkUserFromWebhook(event.data);
        break;
      case 'user.deleted':
        await this.authService.deleteUserByClerkId(event.data.id);
        break;
      default:
        break;
    }

    return { received: true };
  }
}
