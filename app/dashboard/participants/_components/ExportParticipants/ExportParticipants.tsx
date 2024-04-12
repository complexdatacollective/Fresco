'use client';

import { Check, FileUp } from 'lucide-react';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import { useDownload } from '~/hooks/useDownload';
import { api } from '~/trpc/client';

function ExportParticipants() {
  const { data: participants, isLoading } = api.participant.get.all.useQuery();
  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (!participants) return;

      // CSV file format
      const csvData = participants.map((participant) => ({
        identifier: participant.identifier,
        label: participant.label,
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
        title: 'Success',
        icon: <Check />,
        description: 'Participant CSV exported successfully',
        variant: 'success',
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
    <Button
      disabled={isExporting || isLoading || participants?.length === 0}
      onClick={handleExport}
      className="w-full"
    >
      <FileUp className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export Participant List'}
    </Button>
  );
}

export default ExportParticipants;
