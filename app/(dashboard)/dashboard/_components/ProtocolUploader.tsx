'use client';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/Button';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';
import ActiveProtocolSwitch from '~/app/(dashboard)/dashboard/_components/ActiveProtocolSwitch';
import {
  getAssets,
  getProtocolJson,
  readFileHelper,
} from '~/utils/protocolImport';
import ErrorDialog from '~/components/ui/ErrorDialog';
import { useToast } from '~/components/ui/use-toast';
import { Progress } from '~/components/ui/progress';
import { api } from '~/trpc/client';
import { uploadFiles } from '~/lib/uploadthing-helpers';
import { clientRevalidateTag } from '~/utils/clientRevalidate';

type ErrorState = {
  title: string;
  description: React.ReactNode;
  additionalContent?: React.ReactNode;
};

type ProgressState = {
  percent: number;
  status: string;
};

export default function ProtocolUploader() {
  const [error, setError] = useState<ErrorState | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const { toast } = useToast();
  const { mutateAsync: insertProtocol } = api.protocol.insert.useMutation();

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    onDropAccepted: async (acceptedFiles) => {
      try {
        setProgress({
          percent: 0,
          status: 'Processing...',
        });

        const acceptedFile = acceptedFiles[0] as File;
        const fileName = acceptedFile.name;

        setProgress({
          percent: 0,
          status: 'Reading file...',
        });
        const content = await readFileHelper(acceptedFile);

        if (!content) {
          setError({
            title: 'Error reading file',
            description: 'The file could not be read',
          });
          setProgress(null);
          return;
        }

        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(content);
        const protocolJson = await getProtocolJson(zip);

        // Validating protocol...
        setProgress({
          percent: 0,
          status: 'Validating protocol...',
        });

        const { validateProtocol, ValidationError } = await import(
          '@codaco/protocol-validation'
        );

        try {
          await validateProtocol(protocolJson);
        } catch (error) {
          if (error instanceof ValidationError) {
            setError({
              title: 'Protocol was invalid!',
              description: 'The protocol you uploaded was invalid.',
              additionalContent: (
                <Collapsible>
                  <CollapsibleContent>
                    <div>
                      <p>Errors:</p>
                      <ul>
                        {error.logicErrors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                        {error.schemaErrors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ),
            });
            setProgress(null);
            return;
          }

          throw error;
        }

        // Protocol is valid, continue with import
        const assets = await getAssets(protocolJson, zip);

        setProgress({
          percent: 0,
          status: 'Uploading assets...',
        });

        // Calculate overall asset upload progress by summing the progress
        // of each asset, then dividing by the total number of assets * 100.
        const completeCount = assets.length * 100;
        let currentProgress = 0;

        const response = await uploadFiles({
          files: assets,
          endpoint: 'assetRouter',
          onUploadProgress({ progress }) {
            currentProgress += progress;
            setProgress({
              percent: Math.round((currentProgress / completeCount) * 100),
              status: 'Uploading assets...',
            });
          },
        });

        console.log('asset upload response', response);

        await insertProtocol({
          protocol: protocolJson,
          protocolName: fileName,
          assets: response.map((fileResponse) => ({
            assetId: fileResponse.key,
            key: fileResponse.key,
            source: fileResponse.key,
            url: fileResponse.url,
            name: fileResponse.name,
            size: fileResponse.size,
          })),
        });

        toast({
          title: 'Protocol imported!',
          description: 'Your protocol has been successfully imported.',
          variant: 'success',
        });

        setProgress(null);
        await clientRevalidateTag('protocol.get.all');
      } catch (e) {
        console.log(e);
        setError({
          title: 'Error importing protocol',
          description: e.message,
        });
        setProgress(null);
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
        onOpenChange={() => setError(null)}
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
