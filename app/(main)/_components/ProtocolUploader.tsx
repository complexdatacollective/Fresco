'use client';
import { useDropzone } from 'react-dropzone';
import type { FileWithPath } from 'react-dropzone';

import { generateReactHelpers } from '~/utils/uploadthing/useUploadThing';
import { useState, useCallback } from 'react';

import { importProtocol } from '../_actions/importProtocol';
import { buttonVariants } from '~/components/ui/Button';
import { cn } from '~/utils';

const { useUploadThing } = generateReactHelpers();

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { UploadFileResponse } from 'uploadthing/client';
import React from 'react';

export function Uploader() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const onDrop = useCallback((files: FileWithPath[]) => {
    if (files && files[0]) {
      // This a temporary workaround for upload thing. Upload thing will not generate S3 signed urls for
      //Unknown files so we append the .zip extension to .netcanvas files so they can be uploaded to S3
      const file = new File([files[0]], `${files[0].name}.zip`, {
        type: 'application/zip',
      });

      return startUpload([file]);
    }
  }, []);

  const handleUploadComplete = async (
    res: UploadFileResponse[] | undefined,
  ) => {
    if (!res) return;

    setOpen(true);
    const firstFile = res[0];
    if (!firstFile) return;

    setMessage('Importing protocol...');
    const { error, success } = await importProtocol(firstFile);

    if (error) {
      setMessage(`ERROR: ${error}`);
      return;
    }

    if (!success) {
      setMessage('Unknown error.');
      return;
    }

    setMessage('Success!');
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/octect-stream': ['.netcanvas'] },
  });

  const { startUpload, isUploading } = useUploadThing({
    endpoint: 'protocolUploader',
    onClientUploadComplete: handleUploadComplete,
    onUploadError: (error) => {
      setOpen(true);
      setMessage('Error uploading protocol');
    },
    onUploadBegin: () => {
      setOpen(true);
      setMessage('Uploading protocol...');
    },
  });

  return (
    <>
      <div
        className={cn(
          buttonVariants({
            variant: 'default',
            size: 'sm',
          }),
        )}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        Import protocol
      </div>
      <div>Click to select .netcanvas file or drag and drop here</div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Progress</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
