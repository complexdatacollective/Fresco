'use client';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/Button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import ActiveProtocolSwitch from '~/app/(dashboard)/dashboard/_components/ActiveProtocolSwitch';
import {
  getProtocolAssets,
  getProtocolJson,
  fileAsArrayBuffer,
} from '~/utils/protocolImport';
import ErrorDialog from '~/components/ui/ErrorDialog';
import { useToast } from '~/components/ui/use-toast';
import { Progress } from '~/components/ui/progress';
import { api } from '~/trpc/client';
import { uploadFiles } from '~/lib/uploadthing-helpers';
import { clientRevalidateTag } from '~/utils/clientRevalidate';
import { useRouter } from 'next/navigation';
import { DatabaseError } from '~/utils/databaseError';
import { ensureError } from '~/utils/ensureError';
import { ValidationError } from '@codaco/protocol-validation';
import { ErrorDetails } from '~/components/ErrorDetails';
import { XCircle } from 'lucide-react';
import Link from '~/components/Link';
import { AlertDescription } from '~/components/ui/Alert';
import { useProtocolImport } from '~/hooks/useProtocolImport';

export default function ProtocolUploader() {
  const { error, progress, reset, uploadProtocol } = useProtocolImport();

  const router = useRouter();
  const utils = api.useUtils();
  const { toast } = useToast();

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    onDropAccepted: async (acceptedFiles) => {
      const { success } = await uploadProtocol(acceptedFiles[0]);

      if (success) {
        toast({
          title: 'Protocol imported!',
          description: 'Your protocol has been successfully imported.',
          variant: 'success',
        });

        reset();
        await clientRevalidateTag('protocol.get.all');
        await utils.protocol.get.all.invalidate();
        router.refresh();
      }
    },
    accept: {
      'application/octect-stream': ['.netcanvas'],
      'application/zip': ['.netcanvas'],
    },
  });

  return (
    <>
      <ErrorDialog
        open={!!error}
        onOpenChange={reset}
        title={error?.title}
        description={error?.description}
        additionalContent={error?.additionalContent}
      />
      {progress ? (
        <>
          <p>{progress.status}</p>
          <Progress value={progress.percent} />
          <div></div>
          <button>Cancel</button>
        </>
      ) : (
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
      )}
    </>
  );
}
