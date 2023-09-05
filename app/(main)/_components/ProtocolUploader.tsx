'use client';
import { useDropzone } from 'react-dropzone';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FileWithPath } from 'react-dropzone';
import { generateReactHelpers } from '~/utils/uploadthing/useUploadThing';
import { useState, useCallback } from 'react';

import { importProtocol } from '../_actions/importProtocol';
import { Button, buttonVariants } from '~/components/ui/Button';
import { cn } from '~/utils';

const { useUploadThing } = generateReactHelpers();

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import type { UploadFileResponse } from 'uploadthing/client';
import React from 'react';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';

export default function ProtocolUploader() {
  const [open, setOpen] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [dialogContent, setDialogContent] = useState({
    title: 'Protocol import',
    description: 'dfdsfds',
    progress: true,
    error: 'dsfsdf',
  });

  const handleUploadComplete = async (
    res: UploadFileResponse[] | undefined,
  ) => {
    if (!res) return;

    setOpen(true);
    const firstFile = res[0];
    if (!firstFile) return;

    setDialogContent({
      title: 'Protocol import',
      description: 'Importing protocol...',
      progress: true,
      error: '',
    });
    const { error, success } = await importProtocol(firstFile);

    if (error) {
      setDialogContent({
        title: 'Protocol import',
        description: 'Error importing protocol',
        progress: false,
        error: error,
      });
      return;
    }

    if (!success) {
      setDialogContent({
        title: 'Protocol import',
        description: 'Error importing protocol',
        progress: false,
        error: 'Unkown error occured',
      });
      return;
    }

    setDialogContent({
      title: 'Protocol import',
      description: 'Protocol successfully imported!',
      progress: false,
      error: '',
    });
  };

  const { startUpload } = useUploadThing({
    endpoint: 'protocolUploader',
    onClientUploadComplete: handleUploadComplete,
    onUploadError: (error) => {
      setOpen(true);
      setDialogContent({
        title: 'Protocol import',
        description: 'Error uploading protocol',
        progress: false,
        error: error.message,
      });
    },
    onUploadBegin: () => {
      setOpen(true);
      setDialogContent({
        title: 'Protocol import',
        description: 'Uploading protocol...',
        progress: true,
        error: '',
      });
    },
    onUploadProgress: (file, progress) => {
      console.log(
        '🚀 ~ file: ProtocolUploader.tsx:102 ~ ProtocolUploader ~ file>:progress',
        `${file}>${progress}`,
      );
    },
  });

  const onDrop = useCallback(
    (files: FileWithPath[]) => {
      if (files && files[0]) {
        // This a temporary workaround for upload thing. Upload thing will not generate S3 signed urls for
        //Unknown files so we append the .zip extension to .netcanvas files so they can be uploaded to S3
        const file = new File([files[0]], `${files[0].name}.zip`, {
          type: 'application/zip',
        });

        startUpload([file]).catch((e: Error) => {
          setOpen(true);
          setDialogContent({
            title: 'Protocol import',
            description: 'Error uploading protocol',
            progress: false,
            error: e.message,
          });
        });
      }
    },
    [startUpload],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/octect-stream': ['.netcanvas'] },
  });

  return (
    <>
      <div {...getRootProps()}>
        <div
          className={cn(
            buttonVariants({
              variant: 'default',
              size: 'sm',
            }),
          )}
        >
          <input {...getInputProps()} />
          Import protocol
        </div>
        <div>Click to select .netcanvas file or drag and drop here</div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          {dialogContent.progress && (
            <div className="w-full">
              <div className="h-1.5 w-full overflow-hidden bg-pink-100">
                <div className="animate-indeterminate-progress-bar origin-left-right h-full w-full bg-violet-800"></div>
              </div>
            </div>
          )}
          {dialogContent.error && (
            <Collapsible open={showErrorDetails}>
              <Button
                variant={'outline'}
                onClick={() => setShowErrorDetails(!showErrorDetails)}
              >
                {showErrorDetails ? (
                  <>
                    Hide details <ChevronUp />
                  </>
                ) : (
                  <>
                    Show details <ChevronDown />
                  </>
                )}
              </Button>
              <CollapsibleContent className="flex flex-grow">
                <code className="mt-4 flex-grow rounded-md bg-black p-4 text-white">
                  {dialogContent.error}
                </code>
              </CollapsibleContent>
            </Collapsible>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}