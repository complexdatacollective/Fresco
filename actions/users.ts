'use server';

import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { createUserFormDataSchema } from '~/schemas/auth';
import { changePasswordSchema, deleteUsersSchema } from '~/schemas/users';
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

export async function checkUsernameAvailable(
  username: string,
): Promise<{ available: boolean }> {
  await requireApiAuth();

  if (!username || username.length < 4 || username.includes(' ')) {
    return { available: false };
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return { available: !existingUser };
}

export async function deleteUsers(data: unknown) {
  const session = await requireApiAuth();

  const parsedData = deleteUsersSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      error: 'Invalid data',
      data: null,
    };
  }

  const { ids } = parsedData.data;

  // Filter out current user from deletion
  const idsToDelete = ids.filter((id) => id !== session.user.userId);

  if (idsToDelete.length === 0) {
    return {
      error: 'No valid users to delete',
      data: null,
    };
  }

  // Check if this would delete all users
  const userCount = await prisma.user.count();
  if (userCount - idsToDelete.length < 1) {
    return {
      error: 'Cannot delete all users. At least one user must remain.',
      data: null,
    };
  }

  try {
    const usersToDelete = await prisma.user.findMany({
      where: { id: { in: idsToDelete } },
      select: { id: true, username: true },
    });

    const deletedIds: string[] = [];

    for (const user of usersToDelete) {
      await auth.deleteUser(user.id);
      deletedIds.push(user.id);
    }

    const usernames = usersToDelete.map((u) => u.username).join(', ');
    void addEvent('User Deleted', `Deleted user(s): ${usernames}`);
    safeRevalidateTag('getUsers');

    return { error: null, data: { deletedIds } };
  } catch (_error) {
    return {
      error: 'Failed to delete users',
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
