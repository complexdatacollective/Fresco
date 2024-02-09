'use client';

import { Loader2 } from 'lucide-react';
import { type Dispatch, type SetStateAction, useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import useZodForm from '~/hooks/useZodForm';
import ActionError from '~/components/ActionError';
import { api } from '~/trpc/client';
import { participantIdentifierSchema } from '~/shared/schemas/schemas';
import type { Participant } from '@prisma/client';
import { clientRevalidateTag } from '~/utils/clientRevalidate';
import { useRouter } from 'next/navigation';

type ParticipantModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  editingParticipant?: string | null;
  setEditingParticipant?: Dispatch<SetStateAction<string | null>>;
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
  const [isLoading, setIsLoading] = useState(false);
  const utils = api.useUtils();

  const formSchema = z
    .object({
      identifier: participantIdentifierSchema,
    })
    .refine(
      (data) =>
        !existingParticipants?.find((p) => p.identifier === data.identifier),
      {
        path: ['identifier'],
        message: 'This identifier is already in use.',
      },
    );

  type ValidationSchema = z.infer<typeof formSchema>;

  const { mutateAsync: updateParticipant } = api.participant.update.useMutation(
    {
      async onMutate({ identifier, newIdentifier }) {
        await utils.participant.get.all.cancel();

        // snapshot current participants
        const previousValue = utils.participant.get.all.getData();

        // Optimistically update to the new value
        const newValue = previousValue?.map((p) =>
          p.identifier === identifier ? { ...p, identifier: newIdentifier } : p,
        );

        utils.participant.get.all.setData(undefined, newValue);

        setOpen(false);

        return { previousValue };
      },
      onSuccess() {
        router.refresh();
      },
      onError(error, identifiers, context) {
        utils.participant.get.all.setData(undefined, context?.previousValue);
        setError(error.message);
      },
      async onSettled() {
        await utils.participant.get.all.invalidate();
      },
    },
  );

  const router = useRouter();

  const { mutateAsync: createParticipant } = api.participant.create.useMutation(
    {
      async onMutate(identifiers) {
        await utils.participant.get.all.cancel();

        // snapshot current participants
        const previousValue = utils.participant.get.all.getData();

        const newParticipants = identifiers.map((identifier, index) => ({
          id: `optimistic-${index}`,
          identifier,
          interviews: [],
          _count: {
            interviews: 0,
          },
        }));

        const newValue = previousValue
          ? [...newParticipants, ...previousValue]
          : newParticipants;

        // Optimistically update to the new value
        utils.participant.get.all.setData(undefined, newValue);

        setOpen(false);
        reset();
        return { previousValue };
      },
      onError(error, identifiers, context) {
        utils.participant.get.all.setData(undefined, context?.previousValue);
        setError(error.message);
      },
      async onSettled() {
        await utils.participant.get.all.invalidate();
      },
      onSuccess() {
        router.refresh();
      },
    },
  );

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

    if (editingParticipant) {
      await updateParticipant({
        identifier: editingParticipant,
        newIdentifier: data.identifier,
      });
    }

    if (!editingParticipant) {
      await createParticipant([data.identifier]);
    }
  };

  useEffect(() => {
    if (editingParticipant) {
      setValue('identifier', editingParticipant);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingParticipant ? 'Edit Participant' : 'Add Participant'}
          </DialogTitle>
          <DialogDescription>
            {editingParticipant
              ? 'Update the identifier of the participant.'
              : 'To add a new participant, enter an identifier below. This could be a name, a number, or an ID.'}
          </DialogDescription>
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
        >
          <Input
            {...register('identifier')}
            placeholder="Enter a participant identifier..."
            error={errors.identifier?.message}
          />
        </form>
        <DialogFooter>
          <Button form="participant-form" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingParticipant ? 'Update' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantModal;
