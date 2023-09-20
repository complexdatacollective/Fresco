'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { Button } from '~/components/ui/Button';

const ResetButton = () => {
  const [loading, setLoading] = useState(false);

  const { mutateAsync: resetConfigured } = trpc.metadata.reset.useMutation();

  const reset = async () => {
    setLoading(true);
    await resetConfigured();
    window.location.reload();
  };

  return (
    <Button variant="destructive" onClick={reset} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Reset
    </Button>
  );
};

export default ResetButton;
