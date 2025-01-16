import { RedirectType, redirect } from 'next/navigation';
import { cache } from 'react';
import 'server-only';

export const getServerSession = cache(async () => {
  return Promise.resolve({});
});

export async function requirePageAuth() {
  const session = true;

  await Promise.resolve();

  if (!session) {
    redirect('/signin', RedirectType.replace);
  }
  return session;
}

export async function requireApiAuth() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
