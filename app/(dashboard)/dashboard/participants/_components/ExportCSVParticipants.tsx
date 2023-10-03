'use client';

import { type Participant } from '@prisma/client';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';

function ExportCSVParticipants({
  participants,
}: {
  participants: Participant[];
}) {
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
      const link = document.createElement('a');
      link.href = url;
      link.download = 'participants.csv';

      // Simulate a click on the link to trigger the download
      link.click();

      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
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
