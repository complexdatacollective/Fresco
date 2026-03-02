import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { containerClasses } from '~/components/ContainerClasses';
import { MotionSurface } from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { getServerSession } from '~/utils/auth';
import { cx } from '~/utils/cva';
import SandboxCredentials from '../_components/SandboxCredentials';
import { SignInForm } from '../_components/SignInForm';

export const metadata: Metadata = {
  title: 'Fresco - Sign In',
  description: 'Sign in to Fresco.',
};

export default async function Page() {
  await connection();
  const session = await getServerSession();
  if (session) redirect('/dashboard');
  return (
    <MotionSurface
      noContainer
      className={cx(containerClasses, 'mx-auto grow-0')}
      elevation="none"
      baseSize="content"
    >
      <Heading level="h2">Sign In To Fresco</Heading>
      <SandboxCredentials />
      <SignInForm />
    </MotionSurface>
  );
}
