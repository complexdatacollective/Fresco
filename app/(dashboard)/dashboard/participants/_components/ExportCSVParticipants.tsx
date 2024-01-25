'use client';

import { type Participant } from '@prisma/client';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useDownload } from '~/hooks/useDownload';

function ExportCSVParticipants({
  participants,
}: {
  participants: Participant[];
}) {
  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (!participants) return;

      // CSV file format
      const csvData = participants.map((participant) => ({
        id: participant.id,
        identifier: participant.identifier,
        interview_url: `interview/${participant.id}`,
      }));

      const csv = unparse(csvData, { header: true });

      // Create a download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      // trigger the download
      download(url, 'participants.csv');
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('An error occurred while exporting participants');
    }

    setIsExporting(false);
  };

  return (
    <Button disabled={isExporting} onClick={handleExport} variant="outline">
      {isExporting ? 'Exporting...' : 'Export Participant List'}
    </Button>
  );
}

export default ExportCSVParticipants;
