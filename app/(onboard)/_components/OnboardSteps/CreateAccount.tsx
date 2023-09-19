'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { SignUpForm } from '~/app/(onboard)/_components/SignUpForm';
import { setConfigured } from '~/app/_actions';

function CreateAccount() {
  const router = useRouter();

  const completeCallback = useCallback(async () => {
    await setConfigured();
    router.replace('/?step=2');
  }, [router]);

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="mb-4 mt-4">
          To use Fresco, you need to set up an administrator account which will
          enable to you access the protect parts of the app. Only one
          administrator account can be created.
        </p>
      </div>
      <SignUpForm completeCallback={void completeCallback} />
    </div>
  );
}

export default CreateAccount;
