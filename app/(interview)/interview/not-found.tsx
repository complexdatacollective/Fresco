'use client';

import { FileWarning } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function InterviewNotFound() {
  const router = useRouter();
  const redirectToDashboard = () => {
    router.push('/');
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <FileWarning className="mb-4 h-12 w-12 text-violet-600" />
      <h1 className="text-3xl font-extrabold text-violet-700">404</h1>
      <p className="text-lg text-gray-700">Interview not found</p>
      <Button
        variant="outline"
        className="mt-4 bg-violet-600 text-white"
        onClick={redirectToDashboard}
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
