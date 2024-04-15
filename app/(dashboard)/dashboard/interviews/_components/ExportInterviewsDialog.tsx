import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { useToast } from '~/components/ui/use-toast';
import { exportSessions } from '../_actions/export';
import ExportOptionsView from './ExportOptionsView';
import { useDownload } from '~/hooks/useDownload';
import {
  ExportOptionsSchema,
  defaultExportOptions,
} from '~/lib/network-exporters/utils/exportOptionsSchema';
import { type RouterOutputs } from '~/trpc/shared';
import { DialogDescription } from '@radix-ui/react-dialog';
import { Loader2, XCircle } from 'lucide-react';
import useSafeLocalStorage from '~/hooks/useSafeLocalStorage';
import Heading from '~/components/ui/typography/Heading';
import { ensureError } from '~/utils/ensureError';
import { cn } from '~/utils/shadcn';
import { cardClasses } from '~/components/ui/card';

const ExportingStateAnimation = () => {
  return (
    <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center gap-3 bg-background/80 text-primary">
      <div
        className={cn(
          cardClasses,
          'flex flex-col items-center justify-center gap-4 p-10',
        )}
      >
        <Loader2 className="h-20 w-20 animate-spin" />
        <Heading variant="h4">
          Exporting and zipping files. Please wait...
        </Heading>
      </div>
    </div>
  );
};

export const ExportInterviewsDialog = ({
  open,
  handleCancel,
  interviewsToExport,
}: {
  open: boolean;
  handleCancel: () => void;
  interviewsToExport: RouterOutputs['interview']['get']['all'];
}) => {
  const download = useDownload();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const [exportOptions, setExportOptions] = useSafeLocalStorage(
    'exportOptions',
    ExportOptionsSchema,
    defaultExportOptions,
  );

  const handleConfirm = async () => {
    // start export process
    setIsExporting(true);
    try {
      const interviewIds = interviewsToExport.map((interview) => interview.id);

      const result = await exportSessions(interviewIds, exportOptions);

      if (result.error || !result.data) {
        const e = ensureError(result.error);
        throw new Error(e.message);
      }

      const response = await fetch(result.data.url);
      const blob = await response.blob();

      // create a download link
      const url = URL.createObjectURL(blob);

      // Download the zip file
      download(url, result.data.name);
      // clean up the URL object
      URL.revokeObjectURL(url);

      // Delete the zip file from UploadThing
    } catch (error) {
      toast({
        icon: <XCircle />,
        title: 'Error',
        description: 'Failed to export, please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      handleCancel(); // Close the dialog
    }
  };

  return (
    <>
      {isExporting && <ExportingStateAnimation />}
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm File Export Options</DialogTitle>
            <DialogDescription>
              Before exporting, please confirm the export options that you wish
              to use. These options are identical to those found in Interviewer.
            </DialogDescription>
          </DialogHeader>
          <ExportOptionsView
            exportOptions={exportOptions}
            setExportOptions={setExportOptions}
          />
          <DialogFooter>
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              {isExporting ? 'Exporting...' : 'Start export process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
