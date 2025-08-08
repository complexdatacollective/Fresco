import { redirect } from 'next/navigation';
import { containerClasses } from '~/components/ContainerClasses';
import { getServerSession } from '~/utils/auth';
import { cx } from '~/utils/cva';
import SandboxCredentials from '../_components/SandboxCredentials';
import { SignInForm } from '../_components/SignInForm';

export const metadata = {
  title: 'Fresco - Sign In',
  description: 'Sign in to Fresco.',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await getServerSession();

  if (session) {
    // If the user is already signed in, redirect to the dashboard
    redirect('/dashboard');
  }

  return (
    <div className={cx(containerClasses, 'w-[25rem]')}>
      <h1 className="mb-6 text-2xl font-bold">Sign In To Fresco</h1>
      <SandboxCredentials />
      <SignInForm />
    </div>
  );
}
