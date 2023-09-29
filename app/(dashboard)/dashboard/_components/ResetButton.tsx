'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { Button } from '~/components/ui/Button';

const ResetButton = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { mutateAsync: resetConfigured } = trpc.metadata.reset.useMutation();

  const reset = async () => {
    setLoading(true);
    await resetConfigured();
    router.refresh();
  };

  return (
    <Button variant="destructive" onClick={reset} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Reset
    </Button>
  );
};

export default ResetButton;
