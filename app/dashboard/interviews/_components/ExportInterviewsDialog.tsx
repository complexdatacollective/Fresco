import { useExportProgress } from '~/components/ExportProgressProvider';
import { Button } from '@codaco/fresco-ui/Button';
import useSafeLocalStorage from '@codaco/fresco-ui/hooks/useSafeLocalStorage';
import Dialog from '@codaco/fresco-ui/dialogs/Dialog';
import { ExportOptionsSchema } from '@codaco/network-exporters/options';
import ExportOptionsView from './ExportOptionsView';

export const ExportInterviewsDialog = ({
  open,
  handleCancel,
  interviewIds,
}: {
  open: boolean;
  handleCancel: () => void;
  interviewIds: string[];
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
