'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { resetConfigured } from '~/app/_actions';
import { Button } from '~/components/ui/Button';

const ResetButton = () => {
  const [loading, setLoading] = useState(false);

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
