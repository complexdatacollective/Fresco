'use client';

import { type Participant } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { trpc } from '~/app/_trpc/client';
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

interface ParticipantModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  participants: Participant[];
  seletedParticipant: string;
  refetch: () => Promise<unknown>;
  setSeletedParticipant: Dispatch<SetStateAction<string>>;
}

function ParticipantModal({
  open,
  setOpen,
  refetch,
  participants,
  seletedParticipant,
  setSeletedParticipant,
}: ParticipantModalProps) {
  const validationSchema = z
    .object({
      identifier: z
        .string()
        .min(5, { message: 'Identifier must be at least 5 characters long' }),
    })
    .refine(
      (data) => !participants?.find((p) => p.identifier === data.identifier),
      {
        path: ['identifier'],
        message: 'Identifier already exist!',
      },
    );
  type ValidationSchema = z.infer<typeof validationSchema>;

  const { mutateAsync: createParticipant, isLoading: createLodaing } =
    trpc.participant.create.useMutation({
      async onSuccess() {
        await refetch();
      },
    });

  const { mutateAsync: updateParticipant, isLoading: updateLoading } =
    trpc.participant.update.useMutation({
      async onSuccess() {
        await refetch();
      },
    });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useZodForm({
    schema: validationSchema,
  });

  const router = useRouter();

  useEffect(() => {
    reset({ identifier: seletedParticipant });
  }, [seletedParticipant, reset]);

  const onSubmit: SubmitHandler<ValidationSchema> = async (data) => {
    let result;

    if (seletedParticipant) {
      // update participant
      result = await updateParticipant({
        identifier: seletedParticipant,
        newIdentifier: data.identifier,
      });
    } else {
      // add participant
      result = await createParticipant(data);
    }

    if (result.error) throw new Error(result.error);
    if (result.participant) setOpen(false);
    clearAll();
  };

  function clearAll() {
    setSeletedParticipant('');
    reset({});
    router.refresh();
  }

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
        <div className="grid gap-4 py-4">
          <form id="add-participant" onSubmit={handleSubmit(onSubmit)}>
            <Label htmlFor="name" className="text-right">
              Identifier
            </Label>
            <Input
              {...register('identifier')}
              placeholder="participant id..."
            />
            {errors.identifier && (
              <p className="text-red-500">{errors.identifier.message}</p>
            )}
          </form>
        </div>
        <DialogFooter>
          <Button
            form="add-participant"
            type="submit"
            disabled={createLodaing || updateLoading}
          >
            {(createLodaing || updateLoading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {seletedParticipant ? 'Update' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantModal;
