'use client';

import { FileWarning } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';

export default function NotFound() {
  const router = useRouter();
  const redirectToDashboard = () => {
    router.push('/');
  };
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <FileWarning className="mb-4 h-12 w-12 text-violet-700" />
      <h1 className="text-3xl font-extrabold text-violet-700">404</h1>
      <p className="text-lg text-gray-700">Page not found</p>
      <Button
        className="mt-4 bg-violet-600 hover:bg-violet-800"
        onClick={redirectToDashboard}
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
