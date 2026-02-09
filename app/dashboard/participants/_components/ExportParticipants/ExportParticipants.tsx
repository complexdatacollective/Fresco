'use client';

import { FileUp } from 'lucide-react';
import { unparse } from 'papaparse';
import { use, useState } from 'react';
import superjson from 'superjson';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/Toast';
import { useDownload } from '~/hooks/useDownload';
import type {
  GetParticipantsQuery,
  GetParticipantsReturnType,
} from '~/queries/participants';

function ExportParticipants({
  participantsPromise,
}: {
  participantsPromise: GetParticipantsReturnType;
}) {
  const rawParticipants = use(participantsPromise);
  const participants = superjson.parse<GetParticipantsQuery>(rawParticipants);

  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const { add } = useToast();

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
      add({
        title: 'Success',
        description: 'Participant CSV exported successfully',
        type: 'success',
      });
    } catch (error) {
      add({
        title: 'Error',
        description: 'An error occurred while exporting participants',
        type: 'destructive',
      });
      throw new Error('An error occurred while exporting participants');
    }

    setIsExporting(false);
  };

  return (
    <Button
      disabled={participants?.length === 0}
      onClick={handleExport}
      className="w-full"
      icon={<FileUp />}
    >
      {isExporting ? 'Exporting...' : 'Export Participant List'}
    </Button>
  );
}

export default ExportParticipants;
