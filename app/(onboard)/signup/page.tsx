import Link from '~/components/Link';
import { SignUpForm } from '../_components/SignUpForm';

export const metadata = {
  title: 'Fresco - Sign Up',
  description: 'Sign in to Fresco.',
};

export default function Page() {
  return (
    <div className="mt-[-60px] flex w-[30rem] flex-col rounded-xl bg-white/80 p-6 shadow-xl backdrop-blur-md">
      <h1 className="mb-4 text-2xl font-bold">Sign Up</h1>
      <p className="mb-12">
        Create an account to use Fresco. If you already have an account, try{' '}
        <Link href="/signin">signing in</Link>.
      </p>
      <SignUpForm />
    </div>
  );
}
