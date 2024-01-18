/* eslint-disable no-console */
import type { Interview } from '@prisma/client';
import { ArrowDownToLine } from 'lucide-react';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import ExportOptionsView from './ExportOptionsView';
import { exportSessions } from '../_actions/export';

const defaultExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    unifyNetworks: false,
    useScreenLayoutCoordinates: false,
    screenLayoutHeight: 1, // temporarily setting 1 because window isn't provided in the first render
    screenLayoutWidth: 1, // temporarily setting 1 because window isn't provided in the first render
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState(defaultExportOptions);

  useEffect(() => {
    // set window height and width after hydration
    if (typeof window !== 'undefined') {
      setExportOptions((prevState) => ({
        ...prevState,
        globalOptions: {
          ...prevState.globalOptions,
          screenLayoutHeight: window.screen.height,
          screenLayoutWidth: window.screen.width,
        },
      }));
    }
  }, []);

  const handleConfirm = async () => {
    setIsExporting(true);

    // check if screenLayoutHeight and screenLayoutWidth greater than 1
    if (
      exportOptions.globalOptions.screenLayoutHeight >= 1 &&
      exportOptions.globalOptions.screenLayoutWidth >= 1
    ) {
      // start export process
      console.log('interviewsToExport:', interviewsToExport);
      console.log('exportOptions:', exportOptions);

      const result = await exportSessions();

      if (result.data) {
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = result.data.name; // Zip file name
        link.click();
        return;
      }

      // eslint-disable-next-line no-console
      console.log(result.error); // Todo: add proper error handling here

      setOpen(false);

      setTimeout(() => {
        setIsExporting(false);
      }, 4000);
    }
  };

  const handleCancelDialog = () => {
    setInterviewsToExport([]);
    setExportOptions(defaultExportOptions);
    setOpen(false);
  };

  return (
    <>
      {/* Loading state animation */}
      {isExporting && (
        <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center gap-3 bg-black text-white opacity-90">
          <div className="animate-bounce rounded-full border-2 border-white bg-green-600 p-4 text-white">
            <ArrowDownToLine className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold">Saving file please wait...</h2>
        </div>
      )}

      <Dialog open={open} onOpenChange={handleCancelDialog}>
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
              onClick={handleCancelDialog}
              className="my-1 text-xs uppercase lg:text-[14px]"
            >
              Cancel
            </Button>
            <Button
              size={'sm'}
              onClick={() => void handleConfirm()}
              className="my-1 text-xs uppercase lg:text-[14px]"
            >
              Start export process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
