'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SignUpForm } from '~/app/(onboard)/_components/SignUpForm';

function CreateAccount() {
  const router = useRouter();
  const pathname = usePathname() as Route;
  const searchParams = useSearchParams();
  const step = searchParams.get('step');

  const completeCallback = () => {
    router.push(`${pathname}?step=${parseInt(step || '1') + 1}`);
  };

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
      <SignUpForm completeCallback={completeCallback} />
    </div>
  );
}

export default CreateAccount;
