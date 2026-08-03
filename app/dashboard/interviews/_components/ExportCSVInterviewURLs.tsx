'use client';

import { Download } from 'lucide-react';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { Button } from '@codaco/fresco-ui/Button';
import { useToast } from '@codaco/fresco-ui/Toast';
import type { IncompleteInterviewUrlData } from '~/actions/interviews';
import { useDownload } from '~/hooks/useDownload';
import type { ProtocolWithInterviews } from '../../_components/ProtocolsTable/ProtocolsTableClient';

function ExportCSVInterviewURLs({
  protocol,
  interviews,
  disabled = false,
}: {
  protocol?: ProtocolWithInterviews;
  interviews: IncompleteInterviewUrlData[];
  disabled?: boolean;
}) {
  const download = useDownload();
  const [isExporting, setIsExporting] = useState(false);
  const { add } = useToast();

  const handleExport = () => {
    try {
      setIsExporting(true);
      if (!protocol?.id) return;

      const csvData = interviews.map((interview) => ({
        identifier: interview.identifier,
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
        variant: 'success',
      });
    } catch (error) {
      add({
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
      size="sm"
      disabled={!protocol || isExporting || disabled}
      onClick={handleExport}
      icon={<Download />}
      color="primary"
    >
      {isExporting ? 'Exporting...' : 'Export'}
    </Button>
  );
}

export default ExportCSVInterviewURLs;
