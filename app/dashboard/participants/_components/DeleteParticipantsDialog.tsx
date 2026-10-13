'use client';

import { Trash2 } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { Alert, AlertDescription, AlertTitle } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import Dialog from '@codaco/fresco-ui/dialogs/Dialog';

const messages = defineMessages({
  title: {
    id: 'fresco.deleteParticipants.title',
    defaultMessage: 'Are you absolutely sure?',
    description: 'Permanent participant deletion confirmation title.',
  },
  description: {
    id: 'fresco.deleteParticipants.description',
    defaultMessage:
      'This action cannot be undone. This will permanently delete {count, plural, one {# participant} other {# participants}}.',
    description: 'Permanent deletion warning; count is the selection size.',
  },
  warning: {
    id: 'fresco.deleteParticipants.warning',
    defaultMessage: 'Warning',
    description: 'Heading for a warning about related interview data.',
  },
  unexported: {
    id: 'fresco.deleteParticipants.unexported',
    defaultMessage:
      '{count, plural, one {The selected participant has interview data that <strong>has not yet been exported.</strong> Deleting this participant will also delete the interview data.} other {One or more of the selected participants have interview data that <strong>has not yet been exported.</strong> Deleting these participants will also delete the interview data.}}',
    description: 'Warns about deleting related unexported interview data.',
  },
  exported: {
    id: 'fresco.deleteParticipants.exported',
    defaultMessage:
      '{count, plural, one {The selected participant has interview data that will also be deleted.} other {One or more of the selected participants have interview data that will also be deleted.}} This data is marked as having been exported, but you may wish to confirm this before proceeding.',
    description: 'Warning for related interview data marked as exported.',
  },
  deleting: {
    id: 'fresco.deleteParticipants.deleting',
    defaultMessage: 'Deleting\u2026',
    description: 'Busy state while deleting selected participants.',
  },
  confirm: {
    id: 'fresco.deleteParticipants.confirm',
    defaultMessage: 'Permanently Delete',
    description: 'Confirmation button for permanent deletion.',
  },
});

const renderStrongChunks = (chunks: ReactNode[]) => <strong>{chunks}</strong>;

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
  const intl = useAppIntl();

  const [isDeleting, setIsDeleting] = useState(false);

  const dialogContent = useMemo(() => {
    if (!haveInterviews) {
      return null;
    }

    if (haveUnexportedInterviews) {
      return (
        <Alert variant="destructive">
          <AlertTitle>{intl.formatMessage(messages.warning)}</AlertTitle>
          <AlertDescription>
            {intl.formatMessage(messages.unexported, {
              count: participantCount,
              strong: renderStrongChunks,
            })}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="info">
        <AlertTitle>{intl.formatMessage(messages.warning)}</AlertTitle>
        <AlertDescription>
          {intl.formatMessage(messages.exported, {
            count: participantCount,
            strong: renderStrongChunks,
          })}
        </AlertDescription>
      </Alert>
    );
  }, [intl, haveInterviews, haveUnexportedInterviews, participantCount]);

  return (
    <Dialog
      accent="destructive"
      open={open}
      closeDialog={onCancel}
      // The deletion runs to completion once started, so leaving mid-way would
      // look like a cancel while the participants are still deleted.
      dismissible={!isDeleting}
      title={intl.formatMessage(messages.title)}
      description={intl.formatMessage(messages.description, {
        count: participantCount,
      })}
      footer={
        <>
          <Button onClick={onCancel} disabled={isDeleting}>
            {intl.formatMessage(commonMessages.cancel)}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              try {
                await onConfirm();
              } finally {
                setIsDeleting(false);
              }
            }}
            color="destructive"
            icon={<Trash2 />}
          >
            {isDeleting
              ? intl.formatMessage(messages.deleting)
              : intl.formatMessage(messages.confirm)}
          </Button>
        </>
      }
    >
      {dialogContent}
    </Dialog>
  );
};
