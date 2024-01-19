'use server';

import { clerkClient } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { api } from '~/trpc/server';

export const resetAppSettings = async () => {
  try {
    await api.appSettings.reset.mutate();

    // Delete users from Clerk
    const userList = await clerkClient.users.getUserList();

    const deleteUsers = userList.map((user) =>
      // eslint-disable-next-line no-console
      clerkClient.users
        .deleteUser(user.id)
        .catch((reason) =>
          console.log('Failed to delete user', reason, user.id),
        ),
    );

    await Promise.allSettled(deleteUsers);
  } catch (error) {
    throw new Error(error as string);
  }
};

export const setAppConfigured = async () => {
  await api.appSettings.setConfigured.mutate();
  redirect('/dashboard');
};
