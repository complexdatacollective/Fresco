'use client';

import { Trash2 } from 'lucide-react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useState } from 'react';

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { Alert, AlertDescription, AlertTitle } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import Dialog from '@codaco/fresco-ui/dialogs/Dialog';
import { deleteProtocols } from '~/actions/protocols';

import type { ProtocolWithInterviews } from '../../_components/ProtocolsTable/ProtocolsTableClient';

const messages = defineMessages({
  title: {
    id: 'fresco.deleteProtocols.title',
    defaultMessage: 'Are you absolutely sure?',
    description: 'Permanent protocol deletion confirmation title.',
  },
  description: {
    id: 'fresco.deleteProtocols.description',
    defaultMessage:
      'This action cannot be undone. This will permanently delete {count, plural, one {# protocol} other {# protocols}}.',
    description: 'Permanent deletion warning; count is the selection size.',
  },
  warning: {
    id: 'fresco.deleteProtocols.warning',
    defaultMessage: 'Warning',
    description: 'Heading for a warning about related interview data.',
  },
  unexported: {
    id: 'fresco.deleteProtocols.unexported',
    defaultMessage:
      '{count, plural, one {The selected protocol has interview data that <strong>has not yet been exported.</strong> Deleting this protocol will also delete the interview data.} other {One or more of the selected protocols have interview data that <strong>has not yet been exported.</strong> Deleting these protocols will also delete the interview data.}}',
    description: 'Warns about deleting related unexported interview data.',
  },
  exported: {
    id: 'fresco.deleteProtocols.exported',
    defaultMessage:
      '{count, plural, one {The selected protocol has interview data that will also be deleted.} other {One or more of the selected protocols have interview data that will also be deleted.}} This data is marked as having been exported, but you may wish to confirm this before proceeding.',
    description: 'Warning for related interview data marked as exported.',
  },
  deleting: {
    id: 'fresco.deleteProtocols.deleting',
    defaultMessage: 'Deleting\u2026',
    description: 'Busy state while deleting selected protocols.',
  },
  confirm: {
    id: 'fresco.deleteProtocols.confirm',
    defaultMessage: 'Permanently Delete',
    description: 'Confirmation button for permanent deletion.',
  },
});

const renderStrongChunks = (chunks: ReactNode[]) => <strong>{chunks}</strong>;

type DeleteProtocolsDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  protocolsToDelete: ProtocolWithInterviews[];
};

export const DeleteProtocolsDialog = ({
  open,
  setOpen,
  protocolsToDelete,
}: DeleteProtocolsDialogProps) => {
  const intl = useAppIntl();

  const [isDeleting, setIsDeleting] = useState(false);

  const protocolsInfo = {
    hasInterviews: protocolsToDelete.some(
      (protocol) => protocol.interviews.length > 0,
    ),
    hasUnexportedInterviews: protocolsToDelete.some((protocol) =>
      protocol.interviews.some((interview) => !interview.exportTime),
    ),
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteProtocols(protocolsToDelete.map((d) => d.hash));
    } finally {
      setIsDeleting(false);
    }
    setOpen(false);
  };

  const handleCancelDialog = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      closeDialog={() => handleCancelDialog()}
      // The deletion runs to completion once started, so leaving mid-way would
      // look like a cancel while the protocols are still deleted.
      dismissible={!isDeleting}
      title={intl.formatMessage(messages.title)}
      description={intl.formatMessage(messages.description, {
        count: protocolsToDelete.length,
      })}
      footer={
        <>
          <Button disabled={isDeleting} onClick={handleCancelDialog}>
            {intl.formatMessage(commonMessages.cancel)}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => void handleConfirm()}
            icon={<Trash2 />}
            color="destructive"
          >
            {isDeleting
              ? intl.formatMessage(messages.deleting)
              : intl.formatMessage(messages.confirm)}
          </Button>
        </>
      }
    >
      {protocolsInfo.hasInterviews &&
        !protocolsInfo.hasUnexportedInterviews && (
          <Alert variant="info">
            <AlertTitle>{intl.formatMessage(messages.warning)}</AlertTitle>
            <AlertDescription>
              {intl.formatMessage(messages.exported, {
                count: protocolsToDelete.length,
                strong: renderStrongChunks,
              })}
            </AlertDescription>
          </Alert>
        )}
      {protocolsInfo.hasUnexportedInterviews && (
        <Alert variant="destructive">
          <AlertTitle>{intl.formatMessage(messages.warning)}</AlertTitle>
          <AlertDescription>
            {intl.formatMessage(messages.unexported, {
              count: protocolsToDelete.length,
              strong: renderStrongChunks,
            })}
          </AlertDescription>
        </Alert>
      )}
    </Dialog>
  );
};
