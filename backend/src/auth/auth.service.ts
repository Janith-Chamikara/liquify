import { Injectable } from '@nestjs/common';
import type { User as ClerkUser } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service';

export type ClerkWebhookUser = {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  emailAddresses?: Array<{ emailAddress: string }>;
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  public_metadata?: Record<string, any>;
  unsafe_metadata?: Record<string, any>;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private getWebhookEmail(clerkUser: ClerkWebhookUser) {
    return (
      clerkUser.emailAddresses?.[0]?.emailAddress ??
      clerkUser.email_addresses?.[0]?.email_address ??
      null
    );
  }

  private getWebhookFullName(clerkUser: ClerkWebhookUser) {
    const firstName = clerkUser.firstName ?? clerkUser.first_name ?? null;
    const lastName = clerkUser.lastName ?? clerkUser.last_name ?? null;

    return [firstName, lastName].filter(Boolean).join(' ') || null;
  }

  private getWebhookUsername(clerkUser: ClerkWebhookUser) {
    return clerkUser.username ?? `clerk_${clerkUser.id}`;
  }

  async syncClerkUser(clerkUser: ClerkUser) {
    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      null;
    const username = clerkUser.username ?? `clerk_${clerkUser.id}`;

    if (!email) {
      return null;
    }

    const existingUserByClerkId = await this.prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
    });

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (
      existingUserByEmail &&
      (!existingUserByClerkId ||
        existingUserByEmail.id !== existingUserByClerkId.id)
    ) {
      return this.prisma.user.update({
        where: { email },
        data: {
          clerkUserId: clerkUser.id,
          email,
          fullName,
          username,
          lastLogin: new Date(),
        },
      });
    }

    return this.prisma.user.upsert({
      where: { clerkUserId: clerkUser.id },
      create: {
        clerkUserId: clerkUser.id,
        email,
        fullName,
        username,
      },
      update: {
        email,
        fullName,
        username,
        lastLogin: new Date(),
      },
    });
  }

  async syncClerkUserFromWebhook(clerkUser: ClerkWebhookUser) {
    const email = this.getWebhookEmail(clerkUser);
    const fullName = this.getWebhookFullName(clerkUser);
    const username = this.getWebhookUsername(clerkUser);

    const isOnboardingComplete =
      clerkUser.public_metadata?.onboardingComplete === true;

    if (!email) {
      return null;
    }

    const walletAddress = isOnboardingComplete
      ? (clerkUser.public_metadata?.walletAddress as string | undefined)
      : undefined;

    const existingUserByClerkId = await this.prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
    });

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail && !existingUserByClerkId) {
      return this.prisma.user.update({
        where: { email },
        data: {
          clerkUserId: clerkUser.id,
          fullName,
          username,
          ...(walletAddress && { walletAddress }),
        },
      });
    }

    return this.prisma.user.upsert({
      where: { clerkUserId: clerkUser.id },
      create: {
        clerkUserId: clerkUser.id,
        email,
        fullName,
        username,
        ...(walletAddress && { walletAddress }),
      },
      update: {
        email,
        fullName,
        username,
        ...(walletAddress && { walletAddress }),
      },
    });
  }

  async deleteUserByClerkId(clerkUserId: string) {
    return this.prisma.user.deleteMany({
      where: { clerkUserId },
    });
  }
}
