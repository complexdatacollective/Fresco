'use client';

import { Download } from 'lucide-react';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import { useDownload } from '~/hooks/useDownload';
import type { GetInterviewsReturnType } from '~/queries/interviews';
import type { GetProtocolsReturnType } from '~/queries/protocols';
import getBaseUrl from '~/utils/getBaseUrl';

function ExportCSVInterviewURLs({
  protocol,
  interviews,
}: {
  protocol?: Awaited<GetProtocolsReturnType>[0];
  interviews: Awaited<GetInterviewsReturnType>;
}) {
  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (!protocol?.id) return;

      const csvData = interviews.map((interview) => ({
        participant_id: interview.participantId,
        identifier: interview.participant.identifier,
        interview_url: `${getBaseUrl()}/interview/${interview.id}`,
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
      toast({
        description: 'Incomplete intervew URLs CSV exported successfully',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          'An error occurred while exporting incomplete interview URLs',
        variant: 'destructive',
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
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export Incomplete Interview URLs'}
    </Button>
  );
}

export default ExportCSVInterviewURLs;
