'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';

import { SetupChecklist } from '~/app/(dashboard)/dashboard/_components/SetupWizard/SetupChecklist';

export default function SetupWizard() {
  return (
    <Dialog>
      <DialogTrigger>Get Started</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Getting Started</DialogTitle>
          <DialogDescription>A few tasks to get you started</DialogDescription>
        </DialogHeader>
        <SetupChecklist />
      </DialogContent>
    </Dialog>
  );
}
