'use client';

import { Badge } from '~/components/ui/badge';
import { getBaseUrl } from '~/trpc/shared';
import { useToast } from '~/components/ui/use-toast';
import { Copy } from 'lucide-react';
import Paragraph from '~/components/ui/typography/Paragraph';

export const AnonymousRecruitmentURLButton = ({
  protocolId,
}: {
  protocolId: string;
}) => {
  const { toast } = useToast();
  const url = `${getBaseUrl()}/onboard/${protocolId}`;
  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          description: 'Copied to clipboard',
          variant: 'success',
          duration: 3000,
        });
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Could not copy text: ', error);
        toast({
          title: 'Error',
          description: 'Could not copy text',
          variant: 'destructive',
        });
      });
  };

  return (
    <Badge onClick={handleCopyClick} className="cursor-pointer">
      <Paragraph variant="smallText" className="w-36 truncate">
        {url}
      </Paragraph>
      <Copy className="ml-2 h-4 w-4" />
    </Badge>
  );
};
