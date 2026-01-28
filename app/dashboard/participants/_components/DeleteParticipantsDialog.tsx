import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import Dialog from '~/lib/dialogs/Dialog';

type DeleteParticipantsDialog = {
  open: boolean;
  participantCount: number;
  haveInterviews: boolean;
  haveUnexportedInterviews: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export const DeleteParticipantsDialog = ({
  open,
  participantCount,
  haveInterviews,
  haveUnexportedInterviews,
  onConfirm,
  onCancel,
}: DeleteParticipantsDialog) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const dialogContent = useMemo(() => {
    if (!haveInterviews) {
      return null;
    }

    if (haveUnexportedInterviews) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            {participantCount > 1 ? (
              <>
                One or more of the selected participants have interview data
                that <strong> has not yet been exported.</strong> Deleting these
                participants will also delete their interview data.
              </>
            ) : (
              <>
                The selected participant has interview data that
                <strong> has not yet been exported.</strong> Deleting this
                participant will also delete their interview data.
              </>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="info">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          {participantCount > 1 ? (
            <>
              One or more of the selected participants have interview data that
              will also be deleted. This data is marked as having been exported,
              but you may wish to confirm this before proceeding.
            </>
          ) : (
            <>
              The selected participant has interview data that will also be
              deleted. This data is marked as having been exported, but you may
              wish to confirm this before proceeding.
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  }, [haveInterviews, haveUnexportedInterviews, participantCount]);

  return (
    <Dialog
      accent="destructive"
      open={open}
      closeDialog={onCancel}
      title="Are you absolutely sure?"
      description={`This action cannot be undone. This will permanently delete ${participantCount} participant${participantCount > 1 ? 's' : ''}.`}
      footer={
        <>
          <Button onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              await onConfirm();
              setIsDeleting(false);
            }}
            color="destructive"
            icon={<Trash2 />}
          >
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </>
      }
    >
      {dialogContent}
    </Dialog>
  );
};
