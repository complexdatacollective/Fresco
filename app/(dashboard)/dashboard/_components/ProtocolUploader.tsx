'use client';
import { useDropzone } from 'react-dropzone';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FileWithPath } from 'react-dropzone';
import { generateReactHelpers } from '@uploadthing/react/hooks';
import { useState, useCallback } from 'react';

import { importProtocol } from '../_actions/importProtocol';
import { Button } from '~/components/ui/Button';

const { useUploadThing } = generateReactHelpers();

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import type { UploadFileResponse } from 'uploadthing/client';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';
import ActiveProtocolSwitch from '~/app/(dashboard)/dashboard/_components/ActiveProtocolSwitch';
import { api } from '~/trpc/client';

export default function ProtocolUploader({
  onUploaded,
}: {
  onUploaded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [dialogContent, setDialogContent] = useState({
    title: 'Protocol import',
    description: 'dfdsfds',
    progress: true,
    error: 'dsfsdf',
  });

  const utils = api.useUtils();

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

    if (error || !success) {
      setDialogContent({
        title: 'Protocol import',
        description: 'Error importing protocol',
        progress: false,
        error: error ?? 'Unkown error occured',
      });
      return;
    }

    await utils.protocol.get.lastUploaded.refetch();

    setDialogContent({
      title: 'Protocol import',
      description: 'Protocol successfully imported!',
      progress: false,
      error: '',
    });
  };

  const { startUpload } = useUploadThing('protocolUploader', {
    onClientUploadComplete: (res) => void handleUploadComplete(res),
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
          // eslint-disable-next-line no-console
          console.log(e);
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

  function handleFinishImport() {
    onUploaded?.();
    setOpen(false);
  }

  const { data: lastUploadedProtocol } =
    api.protocol.get.lastUploaded.useQuery();

  return (
    <>
      <div
        {...getRootProps()}
        className="mt-2 rounded-xl border-2 border-dashed border-gray-500 bg-gray-200 p-12 text-center"
      >
        <Button variant="default" size="sm">
          <input {...getInputProps()} />
          Import protocol
        </Button>
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
                <div className="h-full w-full origin-left-right animate-indeterminate-progress-bar bg-violet-800"></div>
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
          {!dialogContent.progress &&
            !dialogContent.error &&
            lastUploadedProtocol && (
              <div className="w-full space-y-6">
                <div>
                  <div className="space-y-4">
                    <div className="flex flex-row items-center rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <label>Mark protocol as active?</label>
                        <p className="text-xs">
                          Only one protocol may be active at a time. If you
                          already have an active protocol, activating this one
                          will make it inactive.
                        </p>
                      </div>
                      <div>
                        <ActiveProtocolSwitch
                          initialData={lastUploadedProtocol.active}
                          hash={lastUploadedProtocol.hash}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button type="submit" onClick={handleFinishImport}>
                  Finish Import
                </Button>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
