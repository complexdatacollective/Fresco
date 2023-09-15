'use client';

import { useState } from 'react';
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
import { createParticipant } from '../_actions/actions';
import { Loader2 } from 'lucide-react';

function ParticipantModal() {
  const [pending, setPending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setErrorText(null);
    setPending(true);
    const result = await createParticipant(formData);
    setPending(false);

    if (result.participant) {
      setOpen(false);
    }

    if (result.error) {
      setErrorText(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Participant</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>
            Enter a unique identifier for the participant (could be a name)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <form id="add-participant" action={handleSubmit}>
            {errorText && <p className="text-red-500">{errorText}</p>}
            <Label htmlFor="name" className="text-right">
              Identifier
            </Label>
            <Input name="identifier" required placeholder="participant id..." />
          </form>
        </div>
        <DialogFooter>
          <Button form="add-participant" type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantModal;
