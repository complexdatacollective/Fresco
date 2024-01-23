import { userFormClasses } from '../_shared';
import SignInForm from '../_components/SignInForm';
import { cn } from '~/utils/shadcn';
import type { Route } from 'next';

export const metadata = {
  title: 'Fresco - Sign In',
  description: 'Sign in to Fresco.',
};

export default function Page({
  searchParams,
}: {
  searchParams: {
    callbackUrl?: Route;
  };
}) {
  const { callbackUrl } = searchParams;

  return (
    <div className={cn(userFormClasses, 'w-[25rem]')}>
      <h1 className="mb-6 text-2xl font-bold">Sign In To Fresco</h1>
      <SignInForm callbackUrl={callbackUrl} />
    </div>
  );
}
