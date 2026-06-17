'use server';

import { createHash, randomBytes } from 'crypto';
import { requireApiAuth } from '~/lib/auth/guards';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import {
  createApiTokenSchema,
  deleteApiTokenSchema,
  updateApiTokenSchema,
} from '~/schemas/apiTokens';
import { addEvent } from './activityFeed';

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

// Tokens are stored only as a SHA-256 hash so a database read (backup, replica,
// dump) does not expose usable credentials. The plaintext is shown to the
// operator exactly once, at creation time.
function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createApiToken(data: unknown) {
  const session = await requireApiAuth();

  const { description } = createApiTokenSchema.parse(data);
  const token = generateToken();

  try {
    const apiToken = await prisma.apiToken.create({
      data: {
        token: hashApiToken(token),
        description,
      },
    });

    void addEvent(
      'API Token Created',
      `User ${session.user.username} created API token: ${description ?? 'Untitled'}`,
    );
    safeUpdateTag('getApiTokens');
    safeUpdateTag('activityFeed');

    // Return the token only once, on creation
    return { error: null, data: { ...apiToken, token } };
  } catch (error) {
    return { error: 'Failed to create API token', data: null };
  }
}

export async function updateApiToken(data: unknown) {
  const session = await requireApiAuth();

  const { id, ...updateData } = updateApiTokenSchema.parse(data);

  try {
    const apiToken = await prisma.apiToken.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        description: true,
        createdAt: true,
        lastUsedAt: true,
        isActive: true,
      },
    });

    void addEvent(
      'API Token Updated',
      `User ${session.user.username} updated API token: ${id}`,
    );
    safeUpdateTag('getApiTokens');
    safeUpdateTag('activityFeed');

    return { error: null, data: apiToken };
  } catch (error) {
    return { error: 'Failed to update API token', data: null };
  }
}

export async function deleteApiToken(data: unknown) {
  const session = await requireApiAuth();

  const { id } = deleteApiTokenSchema.parse(data);

  try {
    await prisma.apiToken.delete({
      where: { id },
    });

    void addEvent(
      'API Token Deleted',
      `User ${session.user.username} deleted API token: ${id}`,
    );
    safeUpdateTag('getApiTokens');
    safeUpdateTag('activityFeed');

    return { error: null, data: { id } };
  } catch (error) {
    return { error: 'Failed to delete API token', data: null };
  }
}

// Verify an API token and update lastUsedAt
export async function verifyApiToken(
  token: string,
): Promise<{ valid: boolean }> {
  try {
    const apiToken = await prisma.apiToken.findUnique({
      where: { token: hashApiToken(token), isActive: true },
    });

    if (!apiToken) {
      return { valid: false };
    }

    // Update lastUsedAt
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });

    return { valid: true };
  } catch (error) {
    return { valid: false };
  }
}
