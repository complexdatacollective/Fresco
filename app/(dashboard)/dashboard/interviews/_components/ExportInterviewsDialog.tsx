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
import {
  type ExportOptions,
  ExportOptionsSchema,
  exportSessions,
} from '../_actions/export';
import ExportOptionsView from './ExportOptionsView';
import ExportingStateAnimation from './ExportingStateAnimation';
import { useDownload } from '~/hooks/useDownload';

type ExportInterviewsDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  interviewsToExport: Interview[];
  setInterviewsToExport: Dispatch<SetStateAction<Interview[] | undefined>>;
};

const defaultExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    exportFilename: `networkCanvasExport-${Date.now()}`,
    unifyNetworks: false,
    useScreenLayoutCoordinates: false,
  },
};

const setOptionsToLocalStorage = (options: ExportOptions) => {
  localStorage.setItem('exportOptions', JSON.stringify(options));
};

const getLocalExportOptions = () => {
  const localExportOptions = localStorage.getItem('exportOptions');
  const result = ExportOptionsSchema.safeParse(
    localExportOptions ? JSON.parse(localExportOptions) : null,
  );

  if (!result.success) return null;
  return result.data;
};

export const ExportInterviewsDialog = ({
  open,
  setOpen,
  interviewsToExport,
  setInterviewsToExport,
}: ExportInterviewsDialogProps) => {
  const download = useDownload();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(
    getLocalExportOptions() ?? defaultExportOptions,
  );

  const handleConfirm = async () => {
    // start export process
    setIsExporting(true);
    try {
      const interviewIds = interviewsToExport.map((interview) => interview.id);

      const result = await exportSessions(interviewIds, exportOptions);
      handleCloseDialog();

      if (result.data) {
        // Download the zip file
        download(result.data.url, result.data.name);
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
    setExportOptions(getLocalExportOptions() ?? defaultExportOptions);
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
            setOptionsToLocalStorage={setOptionsToLocalStorage}
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
