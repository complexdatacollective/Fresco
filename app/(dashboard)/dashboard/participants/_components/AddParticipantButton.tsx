import { Loader2 } from 'lucide-react';
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
  DialogTrigger,
} from '~/components/ui/dialog';
import useZodForm from '~/hooks/useZodForm';
import ActionError from '~/components/ActionError';
import { trpc } from '~/app/_trpc/client';
import { participantIdentifierSchema } from '~/shared/schemas';
import { type Participant } from '@prisma/client';
import { useState } from 'react';

interface AddParticipantButtonProps {
  existingParticipants: Participant[];
}

function AddParticipantButton({
  existingParticipants,
}: AddParticipantButtonProps) {
  const [isOpen, setOpen] = useState(false);
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useZodForm({
    schema: formSchema,
    shouldUnregister: true,
  });

  const onSubmit = async (data: ValidationSchema) => {
    setError(null);

    const { error } = await createParticipant([data.identifier]);

    if (error) {
      setError(error);
      return;
    }

    await utils.participant.get.invalidate();

    if (!error) {
      setOpen(false);
      reset();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setError(null);
      reset();
    }
    setOpen(isOpen);
  };

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>Add Participant</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Fresco requires a participant identifier to create a participant.
              Enter one below.
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
              <Input
                {...register('identifier')}
                label="Identifier"
                hint="This could be a participant ID, a name, or a number."
                placeholder="Enter a participant identifier..."
                error={errors.identifier?.message}
              />
            </form>
          </div>
          <DialogFooter>
            <Button form="participant-form" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddParticipantButton;
