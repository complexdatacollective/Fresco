import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "~/components/ui/dialog"

  import { Checkbox } from "~/components/ui/checkbox"

  


export default function SetupWizard() {
    return (
        <Dialog>
  <DialogTrigger>Start Setup Wizard</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Setup Wizard</DialogTitle>
      <DialogDescription>
        A few tasks to get started
      </DialogDescription>
    </DialogHeader>
    <Checkbox /> Create User Account
    <Checkbox /> Upload a Protocol
    <Checkbox /> Complete Orientation
    <Checkbox /> Review Documentation
  </DialogContent>
</Dialog>
    )
}