'use client';

import { type Participant } from '@prisma/client';
import { Download } from 'lucide-react';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import { useDownload } from '~/hooks/useDownload';

function ExportParticipants({
  participants,
}: {
  participants: Participant[] | undefined;
}) {
  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (!participants) return;

      // CSV file format
      const csvData = participants.map((participant) => ({
        id: participant.id,
        identifier: participant.identifier,
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
    <Button disabled={isExporting} onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export Participant List'}
    </Button>
  );
}

export default ExportParticipants;
