import { type Interview } from '@prisma/client';
import { Loader } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import { exportSessions } from '../_actions/export';
import ExportingStateAnimation from './ExportingStateAnimation';

type ExportAllInterviewsButtonProps = {
  interviews: Interview[];
};

const ExportAllInterviewsButton = ({
  interviews,
}: ExportAllInterviewsButtonProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const interviewIds = interviews.map((i) => ({ id: i.id }));

    try {
      setIsExporting(true);
      const result = await exportSessions(interviewIds);

      if (result.data) {
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = result.data.name; // Zip filename
        link.click();
        setIsExporting(false);
        return;
      }

      throw new Error(result.message);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export failed error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export, please try again!',
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  return (
    <>
      {isExporting && <ExportingStateAnimation />}
      <Button disabled={isExporting} onClick={handleExport}>
        {isExporting ? (
          <span className="flex items-center gap-2">
            Exporting...
            <Loader className="h-4 w-4 animate-spin text-white" />
          </span>
        ) : (
          'Export all interviews'
        )}
      </Button>
    </>
  );
};

export default ExportAllInterviewsButton;
