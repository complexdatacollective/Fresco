import { Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import type { ProtocolWithInterviews } from '~/shared/types';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { api } from '~/trpc/client';

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
  const { mutateAsync: deleteProtocols, isLoading: isDeleting } =
    api.protocol.delete.byHash.useMutation();

  const utils = api.useUtils();
  const handleConfirm = async () => {
    await deleteProtocols(protocolsToDelete.map((d) => d.hash));
    await utils.protocol.get.all.refetch();
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  {protocolsToDelete.length > 1 ? (
                    <>
                      One or more of the selected protocols have interview data
                      that will also be deleted.
                    </>
                  ) : (
                    <>
                      The selected protocol has interview data that will also be
                      deleted.
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
          <Button onClick={() => void handleConfirm()} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
