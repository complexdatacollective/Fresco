import Providers from '~/providers/Providers';
import { containerClasses } from '../_components/schemas';
import SignInForm from '../_components/SignInForm';
import { cn } from '~/utils/shadcn';
import { getServerSession } from '~/utils/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Fresco - Sign In',
  description: 'Sign in to Fresco.',
};

export default async function Page() {
  const initialSession = await getServerSession();

  if (initialSession) {
    // If the user is already signed in, redirect to the dashboard
    redirect('/dashboard');
  }

  return (
    <Providers initialSession={initialSession}>
      <div className={cn(containerClasses, 'w-[25rem]')}>
        <h1 className="mb-6 text-2xl font-bold">Sign In To Fresco</h1>
        <SignInForm />
      </div>
    </Providers>
  );
}
