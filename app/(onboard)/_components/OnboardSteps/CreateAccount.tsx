'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SignUpForm } from '~/app/(onboard)/_components/SignUpForm';
import { checkUserExists } from '~/app/_actions';

function CreateAccount() {
  const router = useRouter();

  useEffect(() => {
    checkUserExists()
      .then((userExists) => {
        if (userExists) {
          router.replace('/?step=2');
        }
      })
      .catch((error) => {
        alert(error);
      });
  }, [router]);
  return (
    <div>
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p>Create an administrator account</p>
      </div>
      <SignUpForm />
    </div>
  );
}

export default CreateAccount;
