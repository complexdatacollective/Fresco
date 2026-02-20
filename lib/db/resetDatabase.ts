import { prisma } from '~/lib/db';

/**
 * Deletes all data from the database and creates a fresh initializedAt setting.
 * This is the core database reset logic, separated from orchestration concerns
 * (auth, cache invalidation, file cleanup) for testability.
 */
export async function resetDatabase(): Promise<void> {
  // Delete all data from all tables
  // Note: Some models cascade-delete their children:
  // - User cascades to Session, Key
  // - Protocol cascades to Interview
  // - Participant cascades to Interview
  await Promise.all([
    prisma.user.deleteMany(),
    prisma.participant.deleteMany(),
    prisma.protocol.deleteMany(),
    prisma.appSettings.deleteMany(),
    prisma.events.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.apiToken.deleteMany(),
  ]);

  // Create fresh initializedAt setting
  await prisma.appSettings.create({
    data: {
      key: 'initializedAt',
      value: new Date().toISOString(),
    },
  });
}
