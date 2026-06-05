import 'server-only';

import { prisma } from '~/lib/db';

const WINDOW_MS = 15 * 60 * 1000;
const CLEANUP_AGE_MS = 60 * 60 * 1000;
const MAX_DELAY_MS = 30_000;
const FREE_FAILURES = 1;

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

function calculateDelay(failures: number): number {
  if (failures <= FREE_FAILURES) return 0;
  return Math.min(1000 * Math.pow(2, failures - 2), MAX_DELAY_MS);
}

async function getFailureCount(
  field: 'username' | 'ipAddress',
  value: string,
  since: Date,
): Promise<number> {
  return prisma.loginAttempt.count({
    where: {
      [field]: value,
      success: false,
      timestamp: { gte: since },
    },
  });
}

async function getLastAttemptTimestamp(
  field: 'username' | 'ipAddress',
  value: string,
  since: Date,
): Promise<Date | null> {
  const result = await prisma.loginAttempt.findFirst({
    where: {
      [field]: value,
      success: false,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: 'desc' },
    select: { timestamp: true },
  });
  return result?.timestamp ?? null;
}

export async function checkRateLimit(
  username: string | null,
  ipAddress: string | null,
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const [usernameFailures, ipFailures] = await Promise.all([
    username ? getFailureCount('username', username, windowStart) : 0,
    ipAddress ? getFailureCount('ipAddress', ipAddress, windowStart) : 0,
  ]);

  const worstFailures = Math.max(usernameFailures, ipFailures);
  const delayMs = calculateDelay(worstFailures);

  if (delayMs === 0) {
    return { allowed: true };
  }

  const [usernameLastAttempt, ipLastAttempt] = await Promise.all([
    username
      ? getLastAttemptTimestamp('username', username, windowStart)
      : null,
    ipAddress
      ? getLastAttemptTimestamp('ipAddress', ipAddress, windowStart)
      : null,
  ]);

  const now = Date.now();
  let latestRetryAfter = 0;

  if (usernameLastAttempt) {
    const usernameDelay = calculateDelay(usernameFailures);
    latestRetryAfter = Math.max(
      latestRetryAfter,
      usernameLastAttempt.getTime() + usernameDelay,
    );
  }

  if (ipLastAttempt) {
    const ipDelay = calculateDelay(ipFailures);
    latestRetryAfter = Math.max(
      latestRetryAfter,
      ipLastAttempt.getTime() + ipDelay,
    );
  }

  if (latestRetryAfter === 0 || now >= latestRetryAfter) {
    return { allowed: true };
  }

  return { allowed: false, retryAfter: latestRetryAfter };
}

export async function recordLoginAttempt(
  username: string | null,
  ipAddress: string | null,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      username,
      ipAddress,
      success,
    },
  });

  if (Math.random() < 0.05) {
    await cleanupOldAttempts();
  }
}

export async function cleanupOldAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - CLEANUP_AGE_MS);

  await prisma.loginAttempt.deleteMany({
    where: {
      timestamp: { lt: cutoff },
    },
  });
}
