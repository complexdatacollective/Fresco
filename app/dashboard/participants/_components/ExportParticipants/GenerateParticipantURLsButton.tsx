'use client';
import { FileUp } from 'lucide-react';
import { unparse } from 'papaparse';
import { useState } from 'react';
import { type FormSubmitHandler } from 'redux-form';
import type { ParticipantWithInterviews } from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTableClient';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';
import { Button } from '~/components/ui/Button';
import ComboboxField from '~/lib/form/components/fields/Combobox/Combobox';
import { useDownload } from '~/hooks/useDownload';
import Dialog from '~/lib/dialogs/Dialog';
import useDialog from '~/lib/dialogs/useDialog';
import Field from '~/lib/form/components/Field/Field';
import SelectField from '~/lib/form/components/fields/Select/Native';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';

export const GenerateParticipantURLs = ({
  protocols,
  participants,
}: {
  protocols: ProtocolWithInterviews[];
  participants: ParticipantWithInterviews[];
}) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = () => {
    setOpen(!open);
  };

  const download = useDownload();

  const { openDialog } = useDialog();

  const handleSubmit: FormSubmitHandler = (data: {
    protocol: string;
    participants: string[];
  }) => {
    try {
      const { protocol: protocolId, participants: participantIds } = data;

      // CSV file format
      const csvData = participants
        .filter((participant) => participantIds.includes(participant.id))
        .map((participant) => ({
          id: participant.id,
          identifier: participant.identifier,
          interview_url: `${window.location.origin}/onboard/${protocolId}/?participantId=${participant.id}`,
        }));

      const csv = unparse(csvData, { header: true });

      // Create a download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      // trigger the download
      const protocolNameWithoutExtension =
        protocols.find((p) => p.id === protocolId)?.name.split('.')[0] ??
        'protocol';
      const fileName = `participation_urls_${protocolNameWithoutExtension}.csv`;
      download(url, fileName);
      // Clean up the URL object
      URL.revokeObjectURL(url);

      // Close dialog
      setOpen(false);
    } catch (error) {
      // Show error dialog.
      void openDialog({
        type: 'acknowledge',
        intent: 'destructive',
        title: 'Error',
        description: 'An error occurred while exporting participation URLs',
        actions: {
          primary: { label: 'OK', value: true },
        },
      });
    }
  };

  return (
    <>
      <Button
        disabled={participants?.length === 0}
        onClick={handleOpenChange}
        icon={<FileUp />}
      >
        Export Participation URLs
      </Button>
      <FormStoreProvider>
        <Dialog
          open={open}
          closeDialog={handleOpenChange}
          title="Generate Participation URLs"
          description="Generate a CSV that contains unique participation URLs for all participants by protocol. These URLs can be shared with participants to allow them to take your interview."
          footer={
            <>
              <Button onClick={handleOpenChange}>Cancel</Button>
              <SubmitButton color="primary" form="generate-urls">
                Generate
              </SubmitButton>
            </>
          }
        >
          <Form id="generate-urls" onSubmit={handleSubmit}>
            <Field
              label="Protocol"
              name="protocol"
              required
              component={SelectField}
              options={protocols.map((protocol) => ({
                value: protocol.id,
                label: protocol.name,
              }))}
            />
            <Field
              label="Participants"
              name="participants"
              required
              component={ComboboxField}
              options={participants.map((participant) => ({
                value: participant.id,
                label: participant.identifier,
              }))}
              placeholder="Select Participants..."
              singular="Participant"
              plural="Participants"
              showSelectAll
              showDeselectAll
              initialValue={participants.map((p) => p.id)}
            />
          </Form>
        </Dialog>
      </FormStoreProvider>
    </>
  );
};
