'use client';

import { useRouter } from 'next/navigation';
import { resetConfigured } from '~/app/_actions';

const ResetButton = () => {
  const router = useRouter();

  const reset = async () => {
    await resetConfigured();
    router.push('/');
  };

  return (
    <button
      className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
      onClick={() => reset()}
    >
      Reset
    </button>
  );
};

export default ResetButton;
