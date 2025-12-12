'use client';

import { createId } from '@paralleldrive/cuid2';
import type { Participant } from '~/lib/db/generated/client';
import { HelpCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { z } from 'zod';
import { createParticipant, updateParticipant } from '~/actions/participants';
import ActionError from '~/components/ActionError';
import InfoTooltip from '~/components/InfoTooltip';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import useZodForm from '~/hooks/useZodForm';
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
  const [working, setWorking] = useState(false);

  const router = useRouter();
  const formSchema = z
    .object({
      identifier: participantIdentifierSchema,
      label: participantLabelSchema,
    })
    .refine(
      (data) => {
        const existingParticipant = existingParticipants.find(
          (p) => p.identifier === data.identifier,
        );
        // Allow the current identifier if editing
        return (
          !existingParticipant ||
          (editingParticipant &&
            existingParticipant.id === editingParticipant.id)
        );
      },
      {
        path: ['identifier'],
        message: 'This identifier is already in use.',
      },
    );

  type ValidationSchema = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useZodForm({
    schema: formSchema,
    shouldUnregister: true,
  });

  const onSubmit = async (data: ValidationSchema) => {
    setError(null);
    setWorking(true);

    if (editingParticipant) {
      await updateParticipant({
        existingIdentifier: editingParticipant.identifier,
        formData: data,
      });
    }

    if (!editingParticipant) {
      const result = await createParticipant([data]);

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        setOpen(false);
      }
    }

    setWorking(false);
  };

  useEffect(() => {
    if (editingParticipant) {
      setValue('identifier', editingParticipant.identifier);
      setValue('label', editingParticipant.label ?? '');
    }
  }, [editingParticipant, setValue]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingParticipant?.(null);
      setError(null);
      reset();
    }
  };

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
        <form
          id="participant-form"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={handleSubmit(async (data) => await onSubmit(data))}
          className="flex flex-col gap-2"
        >
          <Input
            {...register('identifier')}
            label="Participant Identifier"
            required
            autoFocus
            hint={
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
            }
            placeholder="Enter an identifier..."
            error={errors.identifier?.message}
            // Add an adornment to the right to allow automatically generating an ID
            inputClassName="pr-28"
            rightAdornment={
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => {
                  setValue('identifier', `p-${createId()}`);
                }}
              >
                Generate
              </Button>
            }
          />
          <Input
            {...register('label')}
            label="Label"
            hint="This optional field allows you to provide a human readable label. This could be a name, or an internal project label for this participant. It does not need to be unique, and will not be exposed to participants."
            placeholder="Enter optional label..."
            error={errors.label?.message}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button form="participant-form" type="submit" disabled={working}>
            {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingParticipant ? 'Update' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantModal;
