'use client';

import SignInForm from '~/app/(onboard)/_components/SignInForm';

interface SignInProps {
  handleNextStep: () => void;
}

function SignIn({ handleNextStep }: SignInProps) {
  return (
    <div>
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p>Sign in to your account</p>
      </div>
      <SignInForm />
      <button onClick={handleNextStep}> next </button>
    </div>
  );
}

export default SignIn;
