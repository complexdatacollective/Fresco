import { DialogDescription } from '@radix-ui/react-dialog';
import { FileWarning, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { trackEvent } from '~/analytics/utils';
import { Button } from '~/components/ui/Button';
import { cardClasses } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import Heading from '~/components/ui/typography/Heading';
import { useToast } from '~/components/ui/use-toast';
import { useDownload } from '~/hooks/useDownload';
import useSafeLocalStorage from '~/hooks/useSafeLocalStorage';
import { ExportOptionsSchema } from '~/lib/network-exporters/utils/types';
import { api } from '~/trpc/client';
import { type RouterOutputs } from '~/trpc/shared';
import { ensureError } from '~/utils/ensureError';
import { cn } from '~/utils/shadcn';
import { deleteZipFromUploadThing } from '../_actions/deleteZipFromUploadThing';
import { exportSessions, prepareExportData } from '../_actions/export';
import ExportOptionsView from './ExportOptionsView';

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

  const { mutate: updateExportTime } =
    api.interview.updateExportTime.useMutation();

  const [exportOptions, setExportOptions] = useSafeLocalStorage(
    'exportOptions',
    ExportOptionsSchema,
    {
      exportCSV: true,
      exportGraphML: true,
      globalOptions: {
        useScreenLayoutCoordinates: true,
        screenLayoutHeight: 1080,
        screenLayoutWidth: 1920,
      },
    },
  );

  const handleConfirm = async () => {
    let exportFilename = null; // Used to track the filename of the temp file uploaded to UploadThing

    // start export process
    setIsExporting(true);
    try {
      const interviewIds = interviewsToExport.map((interview) => interview.id);

      // prepare data for export
      const { formattedSessions, formattedProtocols } =
        await prepareExportData(interviewIds);

      // export the data
      const result = await exportSessions(
        formattedSessions,
        formattedProtocols,
        interviewIds,
        exportOptions,
      );

      if (!result.data) {
        throw new Error(result.error);
      }

      // update export time of interviews
      updateExportTime(interviewIds);

      const { key, name, url: resultUrl } = result.data;

      exportFilename = key;

      const responseAsBlob = await fetch(resultUrl).then((res) => {
        if (!res.ok) {
          throw new Error('HTTP error ' + res.status);
        }
        return res.blob();
      });

      // create a download link
      const url = URL.createObjectURL(responseAsBlob);

      // Download the zip file
      download(url, name);
      // clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        icon: <XCircle />,
        title: 'Error',
        description: 'Failed to export, please try again.',
        variant: 'destructive',
      });
      const e = ensureError(error);
      void trackEvent({
        type: 'Error',
        name: 'FailedToExportInterviews',
        message: e.message,
        stack: e.stack,
        metadata: {
          error: e.name,
          string: e.toString(),
          path: '/dashboard/interviews/_components/ExportInterviewsDialog.tsx',
        },
      });
    } finally {
      if (exportFilename) {
        // Attempt to delete the zip file from UploadThing.
        void deleteZipFromUploadThing(exportFilename).catch((error) => {
          const e = ensureError(error);
          void trackEvent({
            type: 'Error',
            name: 'FailedToDeleteTempFile',
            message: e.message,
            stack: e.stack,
            metadata: {
              error: e.name,
              string: e.toString(),
              path: '/dashboard/interviews/_components/ExportInterviewsDialog.tsx',
            },
          });

          toast({
            icon: <FileWarning />,
            duration: Infinity,
            variant: 'default',
            title: 'Could not delete temporary file',
            description:
              'We were unable to delete the temporary file containing your exported data, which is stored on your UploadThing account. Although extremely unlikely, it is possible that this file could be accessed by someone else. You can delete the file manually by visiting uploadthing.com and logging in with your GitHub account. Please use the feedback button to report this issue.',
          });
        });
      }

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
