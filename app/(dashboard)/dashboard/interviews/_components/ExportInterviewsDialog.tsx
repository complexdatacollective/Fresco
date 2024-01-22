import type { Interview } from '@prisma/client';
import { useState, type Dispatch, type SetStateAction } from 'react';
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
import ExportingStateAnimation from './ExportingStateAnimation';

const defaultExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    exportFilename: `networkCanvasExport-${Date.now()}`,
    unifyNetworks: false,
    useScreenLayoutCoordinates: false,
  },
};

export type ExportOptions = typeof defaultExportOptions;

type ExportInterviewsDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  interviewsToExport: Interview[];
  setInterviewsToExport: Dispatch<SetStateAction<Interview[] | undefined>>;
};

export const ExportInterviewsDialog = ({
  open,
  setOpen,
  interviewsToExport,
  setInterviewsToExport,
}: ExportInterviewsDialogProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState(defaultExportOptions);

  const handleConfirm = async () => {
    // start export process
    setIsExporting(true);
    try {
      const interviewIds = interviewsToExport.map((interview) => ({
        id: interview.id,
      }));

      const result = await exportSessions(interviewIds, exportOptions);
      handleCloseDialog();

      if (result.data) {
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = result.data.name; // Zip filename
        link.click();
        return;
      }

      throw new Error(result.message);
    } catch (error) {
      handleCloseDialog();
      // eslint-disable-next-line no-console
      console.error('Export failed error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export, please try again!',
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = () => {
    setInterviewsToExport([]);
    setExportOptions(defaultExportOptions);
    setOpen(false);
    setIsExporting(false);
  };

  return (
    <>
      {/* Loading state animation */}
      {isExporting && <ExportingStateAnimation />}

      <Dialog open={open} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-h-[95%] max-w-[60%]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Confirm File Export Options
            </DialogTitle>
          </DialogHeader>

          <ExportOptionsView
            exportOptions={exportOptions}
            setExportOptions={setExportOptions}
          />

          <DialogFooter>
            <Button
              variant={'outline'}
              size={'sm'}
              onClick={handleCloseDialog}
              className="my-1 text-xs uppercase lg:text-[14px]"
            >
              Cancel
            </Button>
            <Button
              size={'sm'}
              onClick={() => void handleConfirm()}
              className="my-1 text-xs uppercase lg:text-[14px]"
            >
              {isExporting ? 'Exporting...' : 'Start export process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
