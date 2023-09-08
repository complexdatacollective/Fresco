import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';

function ParticipantModal() {
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
          <div>
            <Label htmlFor="name" className="text-right">
              Identifier
            </Label>
            <Input id="name" placeholder="participant id..." />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantModal;
