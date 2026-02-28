'use client';
import { FileUp } from 'lucide-react';
import { unparse } from 'papaparse';
import { useState } from 'react';
import type { ParticipantWithInterviews } from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTableClient';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { useToast } from '~/components/ui/Toast';
import { useDownload } from '~/hooks/useDownload';
import ComboboxField from '~/lib/form/components/fields/Combobox/Combobox';
import Field from '~/lib/form/components/Field/Field';
import SelectField from '~/lib/form/components/fields/Select/Native';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type FormSubmitHandler } from '~/lib/form/store/types';

export const GenerateParticipantURLs = ({
  protocols,
  participants,
}: {
  protocols: ProtocolWithInterviews[];
  participants: ParticipantWithInterviews[];
}) => {
  const [open, setOpen] = useState(false);
  const download = useDownload();
  const { add } = useToast();

  const handleSubmit: FormSubmitHandler = (data: unknown) => {
    const typedData = data as {
      protocol: string;
      participants: string[];
    };
    try {
      const { protocol: protocolId, participants: participantIds } = typedData;

      const csvData = participants
        .filter((participant) => participantIds.includes(participant.id))
        .map((participant) => ({
          id: participant.id,
          identifier: participant.identifier,
          interview_url: `${window.location.origin}/onboard/${protocolId}/?participantId=${participant.id}`,
        }));

      const csv = unparse(csvData, { header: true });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const protocolNameWithoutExtension =
        protocols.find((p) => p.id === protocolId)?.name.split('.')[0] ??
        'protocol';
      const fileName = `participation_urls_${protocolNameWithoutExtension}.csv`;
      download(url, fileName);
      URL.revokeObjectURL(url);

      setOpen(false);
      add({
        title: 'Success',
        description: 'Participation URLs CSV exported successfully',
        type: 'success',
      });
      return { success: true };
    } catch (error) {
      add({
        title: 'Error',
        description: 'An error occurred while exporting participation URLs',
        type: 'destructive',
      });
      return { success: false };
    }
  };

  return (
    <Popover open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
      <PopoverTrigger
        render={
          <Button
            disabled={participants?.length === 0}
            icon={<FileUp />}
            className="tablet:w-auto w-full"
            data-testid="export-participation-urls-button"
          />
        }
      >
        Export Participation URLs
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-4 p-4">
        <Paragraph intent="smallText" margin="none">
          Generate a CSV that contains unique participation URLs for selected
          participants by protocol.
        </Paragraph>
        <FormStoreProvider>
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
          <SubmitButton color="primary" form="generate-urls">
            Generate
          </SubmitButton>
        </FormStoreProvider>
      </PopoverContent>
    </Popover>
  );
};
