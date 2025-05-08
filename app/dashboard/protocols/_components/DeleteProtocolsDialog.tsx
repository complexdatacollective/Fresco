import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { deleteProtocols } from '~/actions/protocols';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Button } from '~/components/ui/Button';
import type { ProtocolWithInterviews } from '../../_components/ProtocolsTable/ProtocolsTableClient';

interface DeleteProtocolsDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  protocolsToDelete: ProtocolWithInterviews[];
}

export const DeleteProtocolsDialog = ({
  open,
  setOpen,
  protocolsToDelete,
}: DeleteProtocolsDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const [protocolsInfo, setProtocolsInfo] = useState<{
    hasInterviews: boolean;
    hasUnexportedInterviews: boolean;
  }>({
    hasInterviews: false,
    hasUnexportedInterviews: false,
  });
  useEffect(() => {
    setProtocolsInfo({
      hasInterviews: protocolsToDelete?.some(
        (protocol) => protocol.interviews.length > 0,
      ),
      hasUnexportedInterviews: protocolsToDelete?.some((protocol) =>
        protocol.interviews.some((interview) => !interview.exportTime),
      ),
    });
  }, [protocolsToDelete]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await deleteProtocols(protocolsToDelete.map((d) => d.hash));
    setIsDeleting(false);
    setOpen(false);
  };

  const handleCancelDialog = () => {
    setProtocolsInfo({
      hasInterviews: false,
      hasUnexportedInterviews: false,
    });
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleCancelDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>
              {protocolsToDelete.length}{' '}
              {protocolsToDelete.length > 1 ? <>protocols.</> : <>protocol.</>}
            </strong>
          </AlertDialogDescription>
          {protocolsInfo.hasInterviews &&
            !protocolsInfo.hasUnexportedInterviews && (
              <Alert variant="info">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  {protocolsToDelete.length > 1 ? (
                    <>
                      One or more of the selected protocols have interview data
                      that will also be deleted. This data is marked as having
                      been exported, but you may wish to confirm this before
                      proceeding.
                    </>
                  ) : (
                    <>
                      The selected protocol has interview data that will also be
                      deleted. This data is marked as having been exported, but
                      you may wish to confirm this before proceeding.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          {protocolsInfo.hasUnexportedInterviews && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {protocolsToDelete.length > 1 ? (
                  <>
                    One or more of the selected protocols have interview data
                    that <strong>has not yet been exported.</strong> Deleting
                    these protocols will also delete its interview data.
                  </>
                ) : (
                  <>
                    The selected protocol has interview data that
                    <strong> has not yet been exported.</strong> Deleting this
                    protocol will also delete its interview data.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={handleCancelDialog}>
            Cancel
          </AlertDialogCancel>
          <Button
            disabled={isDeleting}
            onClick={() => void handleConfirm()}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
