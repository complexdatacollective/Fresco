import { redirect } from 'next/navigation';
import { containerClasses } from '~/components/ContainerClasses';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
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
    <Surface className={cx(containerClasses)} elevation="none" maxWidth="md">
      <Heading level="h2">Sign In To Fresco</Heading>
      <SandboxCredentials />
      <SignInForm />
    </Surface>
  );
}
