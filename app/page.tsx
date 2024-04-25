import { redirect } from 'next/navigation';
import { requireAppNotExpired } from '~/queries/appSettings';

export default async function Home() {
  await requireAppNotExpired();
  redirect('/dashboard');
}
