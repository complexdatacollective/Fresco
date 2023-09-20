'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Participant } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
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
import { createParticipant, updateParticipant } from '../_actions/actions';

interface ParticipantModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  participants: Participant[];
  seletedParticipant: string;
  setSeletedParticipant: Dispatch<SetStateAction<string>>;
}

function ParticipantModal({
  open,
  setOpen,
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
      (data) => !participants.find((p) => p.identifier === data.identifier),
      {
        path: ['identifier'],
        message: 'Identifier already exist!',
      },
    );

  type ValidationSchema = z.infer<typeof validationSchema>;

  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ValidationSchema>({
    resolver: zodResolver(validationSchema),
  });

  useEffect(() => {
    reset({ identifier: seletedParticipant });
  }, [seletedParticipant, reset]);

  const onSubmit: SubmitHandler<ValidationSchema> = async (data) => {
    let result;
    setPending(true);
    if (seletedParticipant) {
      // update participant
      result = await updateParticipant(seletedParticipant, data.identifier);
      setPending(false);
    } else {
      // add participant
      result = await createParticipant(data.identifier);
      setPending(false);
    }
    if (result.participant) setOpen(false);

    if (result.error) throw new Error(result.error);
    clearAll();
  };

  function clearAll() {
    setSeletedParticipant('');
    reset({});
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
          <Button form="add-participant" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {seletedParticipant ? 'Update' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantModal;
