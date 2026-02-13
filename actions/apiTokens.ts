'use server';

import { randomBytes } from 'crypto';
import { safeUpdateTag } from '~/lib/cache';
import {
  createApiTokenSchema,
  deleteApiTokenSchema,
  updateApiTokenSchema,
} from '~/schemas/apiTokens';
import { requireApiAuth } from '~/utils/auth';
import { prisma } from '~/lib/db';
import { addEvent } from './activityFeed';

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createApiToken(data: unknown) {
  await requireApiAuth();

  const { description } = createApiTokenSchema.parse(data);
  const token = generateToken();

  try {
    const apiToken = await prisma.apiToken.create({
      data: {
        token,
        description,
      },
    });

    void addEvent(
      'API Token Created',
      `Created API token: ${description ?? 'Untitled'}`,
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
  await requireApiAuth();

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

    void addEvent('API Token Updated', `Updated API token: ${id}`);
    safeUpdateTag('getApiTokens');
    safeUpdateTag('activityFeed');

    return { error: null, data: apiToken };
  } catch (error) {
    return { error: 'Failed to update API token', data: null };
  }
}

export async function deleteApiToken(data: unknown) {
  await requireApiAuth();

  const { id } = deleteApiTokenSchema.parse(data);

  try {
    await prisma.apiToken.delete({
      where: { id },
    });

    void addEvent('API Token Deleted', `Deleted API token: ${id}`);
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
      where: { token, isActive: true },
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
