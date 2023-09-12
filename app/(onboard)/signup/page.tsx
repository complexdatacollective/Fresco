import Link from '~/components/Link';
import { SignUpForm } from '../_components/SignUpForm';
import { userFormClasses } from '../_shared';

export const metadata = {
  title: 'Fresco - Sign Up',
  description: 'Sign in to Fresco.',
};

export default function Page() {
  return (
    <div className={userFormClasses}>
      <h1 className="mb-4 text-2xl font-bold">Sign Up</h1>
      <p className="mb-12">
        Create an account to use Fresco. If you already have an account, try{' '}
        <Link href="/signin">signing in</Link>.
      </p>
      <SignUpForm />
    </div>
  );
}
