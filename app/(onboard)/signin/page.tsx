import Link from '~/components/Link';
import SignInForm from '../_components/SignInForm';
import { userFormClasses } from '../_shared';

export const metadata = {
  title: 'Fresco - Sign In',
  description: 'Sign in to Fresco.',
};

export default function Page() {
  return (
    <div className={userFormClasses}>
      <h1 className="mb-4 text-2xl font-bold">Sign In</h1>
      <p className="mb-12">
        Create an account to use Fresco. If you don&apos;t have an account yet,{' '}
        <Link href="/signup">sign up</Link>.
      </p>
      <SignInForm />
    </div>
  );
}
