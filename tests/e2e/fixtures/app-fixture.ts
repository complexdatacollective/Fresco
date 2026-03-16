import { createId } from '@paralleldrive/cuid2';
import { randomBytes } from 'node:crypto';
import { type AppSetting } from '~/lib/db/generated/enums';
import { log } from '../helpers/logger.js';
import { type TestPrismaClient } from '../helpers/prisma.js';

export class AppFixture {
  private prisma: TestPrismaClient;

  constructor(prisma: TestPrismaClient) {
    this.prisma = prisma;
  }

  async setSetting(key: AppSetting, value: string): Promise<void> {
    await this.prisma.appSettings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    log('test', `Set app setting "${key}" = "${value}"`);
  }

  async getSetting(key: AppSetting): Promise<string | null> {
    const row = await this.prisma.appSettings.findUnique({
      where: { key },
    });
    return row?.value ?? null;
  }

  async createApiToken(description: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');

    await this.prisma.apiToken.create({
      data: {
        id: createId(),
        token,
        description,
        isActive: true,
      },
    });

    log('test', `Created API token "${description}"`);
    return token;
  }
}
