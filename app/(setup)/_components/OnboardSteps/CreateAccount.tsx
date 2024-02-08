'use client';

import { SignUpForm } from '~/app/(setup)/_components/SignUpForm';
import { useOnboardingContext } from '../OnboardingProvider';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

function CreateAccount() {
  const { setCurrentStep } = useOnboardingContext();

  const completeCallback = () => {
    void setCurrentStep(2);
  };

  return (
    <div className="w-[30rem]">
      <div className="mb-4">
        <Heading variant="h1">Create an Account</Heading>
        <Paragraph>
          To use Fresco, you need to set up an administrator account which will
          enable to you access the protect parts of the app. Only one
          administrator account can be created.
        </Paragraph>
      </div>
      <SignUpForm completeCallback={completeCallback} />
    </div>
  );
}

export default CreateAccount;
