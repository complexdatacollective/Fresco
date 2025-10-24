'use client';

import { createId } from '@paralleldrive/cuid2';
import type { Participant } from '@prisma/client';
import { HelpCircle, WandSparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { createParticipant, updateParticipant } from '~/actions/participants';
import ActionError from '~/components/ActionError';
import InfoTooltip from '~/components/InfoTooltip';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { ControlledDialog } from '~/lib/dialogs/ControlledDialog';
import { Field, Form, SubmitButton } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/Input';
import { useFormStore } from '~/lib/form/store/formStoreProvider';
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

  const handleSubmit = async (data) => {
    setError(null);

    const typedData = data as {
      identifier: string;
      label?: string | null;
    };

    if (editingParticipant) {
      await updateParticipant({
        existingIdentifier: editingParticipant.identifier,
        formData: data,
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
        errors: { form: [result.error] },
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
  const initialValues = editingParticipant
    ? {
        identifier: editingParticipant.identifier,
        label: editingParticipant.label ?? '',
      }
    : undefined;

  return (
    <ControlledDialog
      open={open}
      closeDialog={() => handleOpenChange(false)}
      title={editingParticipant ? 'Edit Participant' : 'Add Participant'}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <SubmitButton key="submit">
            {editingParticipant ? 'Update' : 'Submit'}
          </SubmitButton>
        </>
      }
    >
      {error && (
        <div className="mb-6 flex flex-wrap">
          <ActionError errorTitle="Error" errorDescription={error} />
        </div>
      )}
      <Form
        key={editingParticipant?.id ?? 'new'} // Force form reset when editing different participant
        onSubmit={handleSubmit}
      >
        <IdentifierField
          existingParticipants={existingParticipants}
          editingParticipant={editingParticipant}
          initialValue={initialValues?.identifier}
        />
        <Field
          key="label"
          name="label"
          label="Label"
          hint="This optional field allows you to provide a human readable label. This could be a name, or an internal project label for this participant. It does not need to be unique, and will not be exposed to participants."
          placeholder="Enter optional label..."
          validation={participantLabelSchema}
          Component={InputField}
          type="text"
          initialValue={initialValues?.label}
        />
      </Form>
    </ControlledDialog>
  );
}

// Separate component to handle the identifier field with generate button
function IdentifierField({
  existingParticipants,
  editingParticipant,
  initialValue,
}: {
  existingParticipants: Participant[];
  editingParticipant?: Participant | null;
  initialValue?: string;
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
        (editingParticipant && existingParticipant.id === editingParticipant.id)
      );
    },
    {
      message: 'This identifier is already in use.',
    },
  );

  const hint = (
    <>
      This could be a study ID, a number, or any other unique identifier. It
      should be unique for each participant, and should not be easy to guess{' '}
      <InfoTooltip
        trigger={<HelpCircle className="inline-block h-4 w-4" />}
        title="Participant Identifiers"
        description={(props) => (
          <Paragraph {...props}>
            Participant identifiers are used by Fresco to onboard participants.
            They might be exposed to the participant during this process via the
            participation URL, and so must <strong>not</strong> contain any
            sensitive information, and must not be easy for other participants
            to guess (e.g. sequential numbers, or easily guessable strings).
          </Paragraph>
        )}
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
      type="text"
      Component={InputField}
      suffixComponent={
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => {
            setFieldValue('identifier', `p-${createId()}`);
          }}
          icon={<WandSparkles />}
        >
          Generate
        </Button>
      }
      initialValue={initialValue}
    />
  );
}

export default ParticipantModal;
