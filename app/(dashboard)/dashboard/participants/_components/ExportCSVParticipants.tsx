'use client';

import { type Participant } from '@prisma/client';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import { useDownload } from '~/hooks/useDownload';
import { getBaseUrl } from '~/trpc/shared';

function ExportCSVParticipants({
  participants,
  protocolId,
  disabled,
}: {
  participants: Participant[] | undefined;
  protocolId: string | undefined;
  disabled: boolean;
}) {
  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (!participants) return;
      if (!protocolId) return;

      // CSV file format
      const csvData = participants.map((participant) => ({
        id: participant.id,
        identifier: participant.identifier,
        interview_url: `${getBaseUrl()}/onboard/${protocolId}/?participantId=${
          participant.id
        }`,
      }));

      const csv = unparse(csvData, { header: true });

      // Create a download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      // trigger the download
      download(url, 'participants.csv');
      // Clean up the URL object
      URL.revokeObjectURL(url);
      toast({
        description: 'Participant CSV exported successfully',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while exporting participants',
        variant: 'destructive',
      });
      throw new Error('An error occurred while exporting participants');
    }

    setIsExporting(false);
  };

  return (
    <Button disabled={disabled || isExporting} onClick={handleExport}>
      {isExporting ? 'Exporting...' : 'Export'}
    </Button>
  );
}

export default ExportCSVParticipants;
