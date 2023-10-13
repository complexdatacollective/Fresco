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
} from '~/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Prisma } from '@prisma/client';

const ProtocolWithInterviews = Prisma.validator<Prisma.ProtocolDefaultArgs>()({
  include: { interviews: true },
});

export type ProtocolWithInterviews = Prisma.ProtocolGetPayload<
  typeof ProtocolWithInterviews
>;

interface DeleteProtocolProps {
  open: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  selectedProtocols: ProtocolWithInterviews[];
  isDeleting: boolean;
}

export const DeleteProtocol = ({
  open,
  onConfirm,
  onCancel,
  selectedProtocols,
  isDeleting,
}: DeleteProtocolProps) => {
  const hasInterviews = selectedProtocols.some(
    (protocol) => protocol.interviews.length > 0,
  );

  const hasInterviewsNotYetExported = selectedProtocols.some((protocol) =>
    protocol.interviews.some((interview) => !interview.exportTime),
  );

  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>
              {selectedProtocols.length}{' '}
              {selectedProtocols.length > 1 ? <>protocols.</> : <>protocol.</>}
            </strong>
          </AlertDialogDescription>
          {hasInterviews && !hasInterviewsNotYetExported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {selectedProtocols.length > 1 ? (
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
          {hasInterviewsNotYetExported && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {selectedProtocols.length > 1 ? (
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
          <AlertDialogCancel disabled={isDeleting} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={() => void onConfirm()} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
