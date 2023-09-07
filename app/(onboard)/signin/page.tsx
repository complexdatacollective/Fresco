import Link from '~/components/Link';
import SignInForm from '../_components/SignInForm';

export const metadata = {
  title: 'Fresco - Sign In',
  description: 'Sign in to Fresco.',
};

export default function Page() {
  return (
    <div className="mt-[-60px] flex w-[30rem] flex-col rounded-xl bg-white/80 p-6 shadow-xl backdrop-blur-md">
      <h1 className="mb-4 text-2xl font-bold">Sign In</h1>
      <p className="mb-12">
        Create an account to use Fresco. If you don&apos;t have an account yet,{' '}
        <Link href="/signup">sign up</Link>.
      </p>
      <SignInForm />
    </div>
  );
}
