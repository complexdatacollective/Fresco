'use client';

import { SignUpForm } from '~/app/(onboard)/_components/SignUpForm';
import { useState, useEffect } from 'react';

interface CreateAccountProps {
  handleNextStep: () => void;
}

function CreateAccount({ handleNextStep }: CreateAccountProps) {
  const [userCreated, setUserCreated] = useState(false);

  const handleUserCreated = () => {
    setUserCreated(true);
  };

  useEffect(() => {
    if (userCreated) {
      handleNextStep();
    }
  });
  return (
    <div>
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p>Create an administrator account</p>
      </div>
      <SignUpForm handleUserCreated={handleUserCreated} />
    </div>
  );
}

export default CreateAccount;
