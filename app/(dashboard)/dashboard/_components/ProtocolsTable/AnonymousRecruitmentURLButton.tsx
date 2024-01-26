'use client';

import { Badge } from '~/components/ui/badge';
import { getBaseUrl } from '~/trpc/shared';
import { useToast } from '~/components/ui/use-toast';
import { Copy } from 'lucide-react';
import { api } from '~/trpc/client';

export const AnonymousRecruitmentURLButton = ({
  protocolId,
}: {
  protocolId: string;
}) => {
  const { data: appSettings } = api.appSettings.get.useQuery();
  const allowAnonymousRecruitment = !!appSettings?.allowAnonymousRecruitment;

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
    <>
      {allowAnonymousRecruitment ? (
        <Badge onClick={handleCopyClick}>
          {url}
          <Copy className="ml-2 h-4 w-4" />
        </Badge>
      ) : (
        <Badge variant="destructive">Disabled</Badge>
      )}
    </>
  );
};
