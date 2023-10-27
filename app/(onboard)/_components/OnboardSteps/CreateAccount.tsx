'use client';

import { SignUpForm } from '~/app/(onboard)/_components/SignUpForm';
import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionProvider';
import { useOnboardingContext } from '../OnboardingProvider';
import { api } from '~/trpc/client';
import { env } from '~/env.mjs';
import { useRouter } from 'next/navigation';

function CreateAccount() {
  const router = useRouter();
  const { currentStep, setCurrentStep } = useOnboardingContext();
  const { session, isLoading } = useSession();
  const { data: adminUserExists, isLoading: isCheckingAdminUser } =
    api.appSettings.get.adminUserExists.useQuery();

  const completeCallback = () => {
    setCurrentStep(2).catch(() => {});
  };

  if (isLoading || isCheckingAdminUser) {
    return null;
  }

  if (adminUserExists) {
    router.push(`/signin?callbackUrl=${encodeURI('/setup')}`);
  }

  return (
    <div className="w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Create an Account</h1>
      </div>
      {session && (
        <div>
          <p className="mb-10">
            You have already created an admin account and are logged in. Please
            continue to the next step in the setup process.
          </p>
          {env.NODE_ENV === 'development' && (
            <Button className="mr-2" variant="destructive">
              Dev mode: sign out
            </Button>
          )}
          <Button onClick={() => setCurrentStep(currentStep + 1)}>
            Continue
          </Button>
        </div>
      )}
      {!session && (
        <>
          <p className="mb-4 mt-4">
            To use Fresco, you need to set up an administrator account which
            will enable to you access the protect parts of the app. Only one
            administrator account can be created.
          </p>
          <SignUpForm completeCallback={completeCallback} />
        </>
      )}
    </div>
  );
}

export default CreateAccount;
