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

function ParticipantModal() {
  const [identifier, setIdentifier] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/participants`,
      {
        method: 'POST',
        body: JSON.stringify({ identifier }),
      },
    ).then(async (res) => await res.json());

    console.log(data);
    setIdentifier('');
    document.getElementById('closeDialog')?.click();
  };

  return (
    <Dialog>
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
          <form id="add-participant" onSubmit={handleSubmit}>
            <Label htmlFor="name" className="text-right">
              Identifier
            </Label>
            <Input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              id="name"
              placeholder="participant id..."
            />
          </form>
        </div>
        <DialogFooter>
          <Button form="add-participant" type="submit">
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantModal;
