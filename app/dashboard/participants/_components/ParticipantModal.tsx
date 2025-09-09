'use client';

import { createId } from '@paralleldrive/cuid2';
import type { Participant } from '@prisma/client';
import { HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { createParticipant, updateParticipant } from '~/actions/participants';
import ActionError from '~/components/ActionError';
import InfoTooltip from '~/components/InfoTooltip';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Field, Form, SubmitButton } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/Input';
import { useFormStore } from '~/lib/form/store/formStoreProvider';
import { type FormSubmitHandler } from '~/lib/form/types';
import {
  participantIdentifierSchema,
  participantLabelSchema,
} from '~/schemas/participant';

type ParticipantModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  editingParticipant?: Participant | null;
  setEditingParticipant?: Dispatch<SetStateAction<Participant | null>>;
  existingParticipants: Participant[];
};

function ParticipantModal({
  open,
  setOpen,
  editingParticipant,
  setEditingParticipant,
  existingParticipants,
}: ParticipantModalProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit: FormSubmitHandler = async (data) => {
    setError(null);

    const typedData = data as {
      identifier: string;
      label?: string | null;
    };

    if (editingParticipant) {
      await updateParticipant({
        identifier: editingParticipant.identifier,
        label: typedData.label,
      });
      router.refresh();
      setOpen(false);
      return { success: true };
    }

    const result = await createParticipant([typedData]);

    if (result.error) {
      setError(result.error);
      return { 
        success: false,
        errors: { form: [result.error] }
      };
    }
    
    router.refresh();
    setOpen(false);
    return { success: true };
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingParticipant?.(null);
      setError(null);
    }
  };

  // Use initialValues to set values when editing
  const initialValues = editingParticipant ? {
    identifier: editingParticipant.identifier,
    label: editingParticipant.label ?? '',
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingParticipant ? 'Edit Participant' : 'Add Participant'}
          </DialogTitle>
        </DialogHeader>
        {error && (
          <div className="mb-6 flex flex-wrap">
            <ActionError errorTitle="Error" errorDescription={error} />
          </div>
        )}
        <Form
          key={editingParticipant?.id ?? 'new'} // Force form reset when editing different participant
          onSubmit={handleSubmit}
          initialValues={initialValues}
          className="flex flex-col gap-2"
        >
          <IdentifierField 
            existingParticipants={existingParticipants}
            editingParticipant={editingParticipant}
          />
          <Field
            key="label"
            name="label"
            label="Label"
            hint="This optional field allows you to provide a human readable label. This could be a name, or an internal project label for this participant. It does not need to be unique, and will not be exposed to participants."
            placeholder="Enter optional label..."
            validation={participantLabelSchema}
            Component={InputField}
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton key="submit">
              {editingParticipant ? 'Update' : 'Submit'}
            </SubmitButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Separate component to handle the identifier field with generate button
function IdentifierField({ 
  existingParticipants, 
  editingParticipant 
}: { 
  existingParticipants: Participant[];
  editingParticipant?: Participant | null;
}) {
  const setFieldValue = useFormStore((state) => state.setFieldValue);

  // Create validation that includes the uniqueness check
  const identifierValidation = participantIdentifierSchema.refine(
    (data) => {
      const existingParticipant = existingParticipants.find(
        (p) => p.identifier === data,
      );
      // Allow the current identifier if editing
      return (
        !existingParticipant ||
        (editingParticipant &&
          existingParticipant.id === editingParticipant.id)
      );
    },
    {
      message: 'This identifier is already in use.',
    },
  );

  const hint = (
    <>
      This could be a study ID, a number, or any other unique
      identifier. It should be unique for each participant, and should
      not be easy to guess{' '}
      <InfoTooltip
        trigger={<HelpCircle className="h-4 w-4" />}
        content={
          <>
            <Heading variant="h4-all-caps">
              Participant Identifiers
            </Heading>
            <Paragraph>
              Participant identifiers are used by Fresco to onboard
              participants. They might be exposed to the participant
              during this process via the participation URL, and so
              must <strong>not</strong> contain any sensitive
              information, and must not be easy for other participants
              to guess (e.g. sequential numbers, or easily guessable
              strings).
            </Paragraph>
          </>
        }
      />
      .
    </>
  );

  return (
    <Field
      key="identifier"
      name="identifier"
      label="Participant Identifier"
      hint={hint}
      placeholder="Enter an identifier..."
      validation={identifierValidation}
      Component={InputField}
      required
      autoFocus
      suffixComponent={
        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => {
            setFieldValue('identifier', `p-${createId()}`);
          }}
        >
          Generate
        </Button>
      }
    />
  );
}

export default ParticipantModal;