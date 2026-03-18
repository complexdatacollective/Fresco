import { useExportProgress } from '~/components/ExportProgressProvider';
import { Button } from '~/components/ui/Button';
import useSafeLocalStorage from '~/hooks/useSafeLocalStorage';
import type { Interview } from '~/lib/db/generated/client';
import Dialog from '~/lib/dialogs/Dialog';
import { ExportOptionsSchema } from '~/lib/network-exporters/utils/types';
import ExportOptionsView from './ExportOptionsView';

export const ExportInterviewsDialog = ({
  open,
  handleCancel,
  interviewsToExport,
}: {
  open: boolean;
  handleCancel: () => void;
  interviewsToExport: Interview[];
}) => {
  const { startExport } = useExportProgress();

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

  const handleConfirm = () => {
    const interviewIds = interviewsToExport.map((interview) => interview.id);
    startExport(interviewIds, exportOptions);
    handleCancel();
  };

  return (
    <Dialog
      open={open}
      closeDialog={handleCancel}
      title="Confirm File Export Options"
      description="Before exporting, please confirm the export options that you wish to use. These options are identical to those found in Interviewer."
      footer={
        <>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} color="primary">
            Start export process
          </Button>
        </>
      }
    >
      <ExportOptionsView
        exportOptions={exportOptions}
        setExportOptions={setExportOptions}
      />
    </Dialog>
  );
};
