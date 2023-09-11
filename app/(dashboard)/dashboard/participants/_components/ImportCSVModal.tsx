'use client';
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
import Dropzone from './Dropzone';
import { useState } from 'react';

const ImportCSVModal = () => {
  const [files, setFiles] = useState<Array<File>>([]);
  const handleSubmit = () => {};

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Import participants</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import participants</DialogTitle>
          <DialogDescription>Drag and drop CSV file here</DialogDescription>
        </DialogHeader>
        <form id="uploadFile" onSubmit={handleSubmit}>
          <Dropzone
            {...{ files, setFiles }}
            className="mx-auto mt-5 cursor-pointer border border-dashed border-neutral-300 p-8 transition-colors hover:border-red-400"
          />
        </form>
        <DialogFooter>
          <Button form="uploadFile" type="submit">
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCSVModal;
