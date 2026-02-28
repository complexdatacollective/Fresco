'use client';

import { Download } from 'lucide-react';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/Toast';
import { useDownload } from '~/hooks/useDownload';
import type { GetInterviewsQuery } from '~/queries/interviews';
import type { ProtocolWithInterviews } from '../../_components/ProtocolsTable/ProtocolsTableClient';

function ExportCSVInterviewURLs({
  protocol,
  interviews,
}: {
  protocol?: ProtocolWithInterviews;
  interviews: Awaited<GetInterviewsQuery>;
}) {
  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const { add } = useToast();

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (!protocol?.id) return;

      const csvData = interviews.map((interview) => ({
        participant_id: interview.participantId,
        identifier: interview.participant.identifier,
        interview_url: `${window.location.origin}/interview/${interview.id}`,
      }));

      const csv = unparse(csvData, { header: true });

      // Create a download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      // trigger the download
      const protocolNameWithoutExtension = protocol.name.split('.')[0];
      const fileName = `incomplete_interview_urls_${protocolNameWithoutExtension}.csv`;
      download(url, fileName);
      // Clean up the URL object
      URL.revokeObjectURL(url);
      add({
        title: 'Success',
        description: 'Incomplete interview URLs CSV exported successfully',
        type: 'success',
      });
    } catch (error) {
      add({
        title: 'Error',
        description:
          'An error occurred while exporting incomplete interview URLs',
        type: 'destructive',
      });
      throw new Error(
        'An error occurred while exporting incomplete interview URLs',
      );
    }

    setIsExporting(false);
  };

  return (
    <Button
      disabled={!protocol || isExporting}
      onClick={handleExport}
      className="w-full"
    >
      <Download className="mr-2 size-4" />
      {isExporting ? 'Exporting...' : 'Export Incomplete Interview URLs'}
    </Button>
  );
}

export default ExportCSVInterviewURLs;
