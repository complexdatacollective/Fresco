import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
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

export default function Page() {
  return (
    <Surface className={cx(containerClasses)} elevation="none" maxWidth="md">
      <Heading level="h2">Sign In To Fresco</Heading>
      <SandboxCredentials />
      <Suspense
        fallback={
          <div className="flex justify-center py-4">
            <Loader2 className="size-6 animate-spin" />
          </div>
        }
      >
        <SignInGate />
      </Suspense>
      <SignInForm />
    </Surface>
  );
}

async function SignInGate() {
  const session = await getServerSession();
  if (session) redirect('/dashboard');
  return null;
}
