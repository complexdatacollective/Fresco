import { PrismaClient } from '@prisma/client';
import { env } from '~/env';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const appSettings = await tx.appSettings.findFirst();
    // Add new key-value pairs from existing AppSettings
    await tx.appSettings.createMany({
      data: [
        {
          key: 'allowAnonymousRecruitment',
          value: appSettings?.allowAnonymousRecruitment.toString() ?? 'false',
        },
        {
          key: 'limitInterviews',
          value: appSettings?.limitInterviews.toString() ?? 'false',
        },
        {
          key: 'configured',
          value: appSettings?.configured.toString() ?? 'false',
        },
        {
          key: 'initializedAt',
          value:
            appSettings?.initializedAt.toString() ?? new Date().toISOString(),
        },
        {
          key: 'installationId',
          value:
            env.INSTALLATION_ID ??
            appSettings?.installationId.toString() ??
            'installationId',
        },
      ],
    });
    // Add new key-value pairs from environment variables
    if (env.PUBLIC_URL) {
      await tx.appSettings.create({
        data: {
          key: 'PUBLIC_URL',
          value: env.PUBLIC_URL,
        },
      });
    }
    if (env.UPLOADTHING_SECRET) {
      await tx.appSettings.create({
        data: {
          key: 'UPLOADTHING_SECRET',
          value: env.UPLOADTHING_SECRET,
        },
      });
    }
    if (env.UPLOADTHING_APP_ID) {
      await tx.appSettings.create({
        data: {
          key: 'UPLOADTHING_APP_ID',
          value: env.UPLOADTHING_APP_ID,
        },
      });
    }
    if (env.SANDBOX_MODE) {
      await tx.appSettings.create({
        data: {
          key: 'sandboxMode',
          value: env.SANDBOX_MODE ? 'true' : 'false',
        },
      });
    }
    if (env.DISABLE_ANALYTICS) {
      await tx.appSettings.create({
        data: {
          key: 'disableAnalytics',
          value: env.DISABLE_ANALYTICS ? 'true' : 'false',
        },
      });
    }
  });
}

main()
  // eslint-disable-next-line @typescript-eslint/require-await
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
