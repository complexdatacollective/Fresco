import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { getServerSession } from '~/utils/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { login } from './actions';

export const loginSchema = z.object({
  // The preprocess step is required for zod to perform the required check properly
  // as the value of an empty input is usually an empty string
  username: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string({ required_error: 'Username is required' }),
  ),
  password: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string({ required_error: 'Password is required' }),
  ),
});

export default async function SignInForm() {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
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
        {/* {loading ? ( */}
        {/* <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </Button> */}
        {/* ) : ( */}
        <Button type="submit">Sign in</Button>
        {/* )} */}
      </div>
    </form>
  );
}
