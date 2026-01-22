'use server';

import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { createUserFormDataSchema } from '~/schemas/auth';
import { changePasswordSchema, deleteUserSchema } from '~/schemas/users';
import { auth, requireApiAuth } from '~/utils/auth';
import { addEvent } from './activityFeed';

export async function createUser(data: unknown) {
  await requireApiAuth();

  const parsedData = createUserFormDataSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      error: 'Invalid form data',
      data: null,
    };
  }

  const { username, password } = parsedData.data;

  try {
    await auth.createUser({
      key: {
        providerId: 'username',
        providerUserId: username,
        password,
      },
      attributes: {
        username,
      },
    });

    void addEvent('User Created', `Created user: ${username}`);
    safeRevalidateTag('getUsers');

    return { error: null, data: { username } };
  } catch (_error) {
    return {
      error: 'Failed to create user. Username may already exist.',
      data: null,
    };
  }
}

export async function deleteUser(data: unknown) {
  const session = await requireApiAuth();

  const parsedData = deleteUserSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      data: null,
    };
  }

  const { id } = parsedData.data;

  // Prevent self-deletion
  if (id === session.user.userId) {
    return {
      error: 'You cannot delete your own account',
      data: null,
    };
  }

  // Check if this is the last user
  const userCount = await prisma.user.count();
  if (userCount <= 1) {
    return {
      error: 'Cannot delete the last user',
      data: null,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { username: true },
    });

    if (!user) {
      return {
        error: 'User not found',
        data: null,
      };
    }

    await auth.deleteUser(id);

    void addEvent('User Deleted', `Deleted user: ${user.username}`);
    safeRevalidateTag('getUsers');

    return { error: null, data: { id } };
  } catch (_error) {
    return {
      error: 'Failed to delete user',
      data: null,
    };
  }
}

export async function changePassword(data: unknown) {
  const session = await requireApiAuth();

  const parsedData = changePasswordSchema.safeParse(data);

  if (!parsedData.success) {
    const errors = parsedData.error.flatten();
    return {
      error: errors.fieldErrors.newPassword?.[0] ?? 'Invalid data',
      data: null,
    };
  }

  const { currentPassword, newPassword } = parsedData.data;

  try {
    // Verify current password
    await auth.useKey('username', session.user.username, currentPassword);
  } catch (_error) {
    return {
      error: 'Current password is incorrect',
      data: null,
    };
  }

  try {
    // Update password
    await auth.updateKeyPassword(
      'username',
      session.user.username,
      newPassword,
    );

    void addEvent(
      'Password Changed',
      `User ${session.user.username} changed their password`,
    );

    return { error: null, data: { success: true } };
  } catch (_error) {
    return {
      error: 'Failed to update password',
      data: null,
    };
  }
}
