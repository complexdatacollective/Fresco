import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '~/utils/auth';

const ServerProtectedPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Update to use current URL
    redirect('/signin?callbackUrl=/protected/server');
  }

  return (
    <section className="container">
      <h1 className="text-2xl font-bold">
        This is a <span className="text-emerald-400">server-side</span>{' '}
        protected page
      </h1>
      <h2 className="mt-4 font-medium">You are logged in as:</h2>
      <p className="mt-4">{session?.user?.name}</p>
    </section>
  );
};

export default ServerProtectedPage;
