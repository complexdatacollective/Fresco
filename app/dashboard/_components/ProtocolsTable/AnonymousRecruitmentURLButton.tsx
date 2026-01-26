'use client';

import { Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/Toast';

export const AnonymousRecruitmentURLButton = ({
  protocolId,
}: {
  protocolId: string;
}) => {
  const { promise } = useToast();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/onboard/${protocolId}`);
    }
  }, [protocolId]);

  const handleCopyClick = () => {
    if (!url) {
      return;
    }

    void promise(navigator.clipboard.writeText(url), {
      loading: 'Copying URL to clipboard...',
      success: 'URL copied to clipboard!',
      error: 'Failed to copy URL to clipboard.',
    });
  };

  return (
    <Button size="sm" onClick={handleCopyClick} color="primary">
      <Copy className="mr-2 size-4" />
      <span className="w-36 truncate">{url}</span>
    </Button>
  );
};
