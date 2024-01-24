'use client';

import { SignUpForm } from '~/app/(setup)/_components/SignUpForm';
import { useOnboardingContext } from '../OnboardingProvider';

function CreateAccount() {
  const { setCurrentStep } = useOnboardingContext();

  const completeCallback = () => {
    void setCurrentStep(2);
  };

  return (
    <div className="w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Create an Account</h1>
      </div>
      <p className="mb-4 mt-4">
        To use Fresco, you need to set up an administrator account which will
        enable to you access the protect parts of the app. Only one
        administrator account can be created.
      </p>
      <SignUpForm completeCallback={completeCallback} />
    </div>
  );
}

export default CreateAccount;
