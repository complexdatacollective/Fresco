'use client';

import { Download } from 'lucide-react';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { type ParticipantWithInterviews } from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTableClient';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/Toast';
import { useDownload } from '~/hooks/useDownload';

function ExportCSVParticipantURLs({
  protocol,
  participants,
}: {
  protocol?: ProtocolWithInterviews;
  participants: ParticipantWithInterviews[];
}) {
  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (!participants) return;
      if (!protocol?.id) return;

      // CSV file format
      const csvData = participants.map((participant) => ({
        id: participant.id,
        identifier: participant.identifier,
        interview_url: `${window.location.origin}/onboard/${protocol.id}/?participantId=${participant.id}`,
      }));

      const csv = unparse(csvData, { header: true });

      // Create a download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      // trigger the download
      const protocolNameWithoutExtension = protocol.name.split('.')[0];
      const fileName = `participation_urls_${protocolNameWithoutExtension}.csv`;
      download(url, fileName);
      // Clean up the URL object
      URL.revokeObjectURL(url);
      toast({
        description: 'Participation URLs CSV exported successfully',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while exporting participation URLs',
        variant: 'destructive',
      });
      throw new Error('An error occurred while exporting participation URLs');
    }

    setIsExporting(false);
  };

  return (
    <Button
      disabled={!protocol || participants?.length === 0 || isExporting}
      onClick={handleExport}
      className="w-full"
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export Participation URLs'}
    </Button>
  );
}

export default ExportCSVParticipantURLs;
