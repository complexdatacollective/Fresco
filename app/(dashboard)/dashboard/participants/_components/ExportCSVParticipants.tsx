'use client';

import type { Participant } from '@prisma/client';
import { unparse } from 'papaparse';
import { Button } from '~/components/ui/Button';

async function ExportCSVParticipants() {
  const handleExport = async () => {
    try {
      const data: any = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/participants`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      ).then(async (res) => await res.json());

      if (data.error) throw new Error(data.msg);

      const participants: Participant[] = data.participants;

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
  };

  return <Button onClick={handleExport}>Export Data</Button>;
}

export default ExportCSVParticipants;
