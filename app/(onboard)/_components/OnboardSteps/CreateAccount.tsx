'use client';

import { SignUpForm } from '~/app/(onboard)/_components/SignUpForm';

interface CreateAccountProps {
  handleNextStep: () => void;
}

function CreateAccount({ handleNextStep }: CreateAccountProps) {
  return (
    <div>
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p>Create an administrator account</p>
      </div>
      <SignUpForm />
      <div className="flex justify-start pt-4">
        <button onClick={handleNextStep}>Next</button>
      </div>
    </div>
  );
}

export default CreateAccount;
