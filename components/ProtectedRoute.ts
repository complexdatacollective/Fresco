import { redirect } from 'next/navigation';
import { getServerAuthSession } from '~/utils/auth';

export default async function ProtectedRoute() {
  const session = await getServerAuthSession();

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
}
