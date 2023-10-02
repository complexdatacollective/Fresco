'use client';

import { Loader2 } from 'lucide-react';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import useZodForm from '~/hooks/useZodForm';
import ActionError from '~/components/ActionError';
import { trpc } from '~/app/_trpc/client';
import { participantIdentifierSchema } from '~/shared/schemas';
import { Participant } from '@prisma/client';

interface ParticipantModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  editingParticipant: string | null;
  existingParticipants: Participant[];
}

function ParticipantModal({
  open,
  setOpen,
  editingParticipant,
  existingParticipants,
}: ParticipantModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useContext();

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

  const { mutateAsync: createParticipant } =
    trpc.participant.create.useMutation({
      onMutate() {
        setIsLoading(true);
      },
      async onSuccess() {
        await utils.participant.get.invalidate();
      },
      onError(error) {
        setError(error.message);
      },
      onSettled() {
        setIsLoading(false);
      },
    });

  const { mutateAsync: updateParticipant } =
    trpc.participant.update.useMutation({
      onMutate() {
        setIsLoading(true);
      },
      async onSuccess() {
        await utils.participant.get.invalidate();
      },
      onError(error) {
        setError(error.message);
      },
      onSettled() {
        setIsLoading(false);
      },
    });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useZodForm({
    schema: formSchema,
  });

  const onSubmit = async (data: ValidationSchema) => {
    setError(null);

    // If we are editing a participant, update the identifier.
    if (editingParticipant) {
      await updateParticipant({
        identifier: editingParticipant,
        newIdentifier: data.identifier,
      });
    } else {
      const { error } = await createParticipant([data.identifier]);

      if (error) {
        setError(error);
        return;
      }
    }

    await utils.participant.get.invalidate();

    if (!error) {
      setOpen(false);
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-2" variant="outline">
          Add Participant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>
            Enter a unique identifier for the participant (could be a name)
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="mb-6 flex flex-wrap">
            <ActionError errorTitle="Error" errorDescription={error} />
          </div>
        )}
        <div className="grid gap-4 py-4">
          <form
            id="participant-form"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={handleSubmit(async (data) => await onSubmit(data))}
          >
            <Label htmlFor="name" className="text-right">
              Identifier
            </Label>
            <Input
              {...register('identifier')}
              placeholder="participant id..."
              error={errors.identifier?.message}
            />
          </form>
        </div>
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
