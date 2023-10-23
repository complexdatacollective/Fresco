'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '~/trpc/client';
import { Button } from '~/components/ui/Button';

const ResetButton = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { mutateAsync: resetConfigured } = api.appSettings.reset.useMutation();

  const reset = async () => {
    setLoading(true);
    await resetConfigured();
    router.refresh();
  };

  return (
    <Button
      variant="destructive"
      onClick={() => void reset()}
      disabled={loading}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Reset all app data
    </Button>
  );
};

export default ResetButton;
