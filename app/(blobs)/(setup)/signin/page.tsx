import { containerClasses } from '../_components/schemas';
import { cn } from '~/utils/shadcn';
import { getServerSession } from '~/utils/auth';
import { redirect } from 'next/navigation';
import { Input } from '~/components/ui/Input';
import { login } from '~/actions/auth';
import SubmitButton from '~/components/ui/SubmitButton';

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
    <div className={cn(containerClasses, 'w-[25rem]')}>
      <h1 className="mb-6 text-2xl font-bold">Sign In To Fresco</h1>
      <form action={login} className="flex w-full flex-col">
        {/* {responseError && (
        <div className="mb-6 flex flex-wrap">
          <ActionError
            errorTitle={responseError.title}
            errorDescription={responseError.description}
          />
        </div>
      )} */}
        <div className="mb-6 flex flex-wrap">
          <Input
            label="Username"
            name="username"
            autoComplete="username"
            // error={errors.username?.message}
            className="w-full"
            // {...register('username')}
          />
        </div>
        <div className="mb-6 flex flex-wrap">
          <Input
            type="password"
            label="Password"
            name="password"
            autoComplete="current-password"
            className="w-full"
            // error={errors.password?.message}
            // {...register('password')}
          />
        </div>
        <div className="flex flex-wrap">
          <SubmitButton>Sign In</SubmitButton>
        </div>
      </form>
    </div>
  );
}
