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
import Link from 'next/link';
import { ErrorDetails } from '~/components/ErrorDetails';

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
  const router = useRouter();
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

        const fileArrayBuffer = await fileAsArrayBuffer(acceptedFile);
        const JSZip = (await import('jszip')).default; // Dynamic import to reduce bundle size
        const zip = await JSZip.loadAsync(fileArrayBuffer);
        const protocolJson = await getProtocolJson(zip);

        // Validating protocol...
        setProgress({
          percent: 0,
          status: 'Validating protocol...',
        });

        const { validateProtocol } = await import(
          '@codaco/protocol-validation'
        );

        // This function will throw on validation errors, with type ValidationError
        await validateProtocol(protocolJson);

        // After this point, assume the protocol is valid.
        const assets = await getProtocolAssets(protocolJson, zip);

        console.log('assets', assets);

        setProgress({
          percent: 0,
          status: 'Uploading assets...',
        });

        // Calculate overall asset upload progress by summing the progress
        // of each asset, then dividing by the total number of assets * 100.
        const completeCount = assets.length * 100;
        let currentProgress = 0;

        const uploadedFiles = await uploadFiles({
          files: assets.map((asset) => asset.file),
          endpoint: 'assetRouter',
          onUploadProgress({ progress }) {
            currentProgress += progress;
            setProgress({
              percent: Math.round((currentProgress / completeCount) * 100),
              status: 'Uploading assets...',
            });
          },
        });

        // The asset 'name' prop matches across the assets array and the
        // uploadedFiles array, so we can just map over one of them and
        // merge the properties we need to add to the database.
        const assetsWithUploadMeta = assets.map((asset) => {
          const uploadedAsset = uploadedFiles.find(
            (uploadedFile) => uploadedFile.name === asset.name,
          );

          if (!uploadedAsset) {
            throw new Error('Asset upload failed');
          }

          return {
            key: uploadedAsset.key,
            assetId: asset.assetId,
            name: asset.name,
            type: asset.type,
            url: uploadedAsset.url,
            size: uploadedAsset.size,
          };
        });

        setProgress({
          percent: 100,
          status: 'Creating database entry for protocol...',
        });

        const result = await insertProtocol({
          protocol: protocolJson,
          protocolName: fileName,
          assets: assetsWithUploadMeta,
        });

        if (result.error) {
          throw new DatabaseError(result.error, result.errorDetails);
        }

        toast({
          title: 'Protocol imported!',
          description: 'Your protocol has been successfully imported.',
          variant: 'success',
        });

        setProgress(null);
        await clientRevalidateTag('protocol.get.all');
        router.refresh();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);

        const error = ensureError(e);

        // Validation errors come from @codaco/protocol-validation
        if (error instanceof ValidationError) {
          setError({
            title: 'Protocol was invalid!',
            description: (
              <>
                <p>
                  The protocol you uploaded was invalid. Please see the details
                  below for specific validation errors that were found.
                </p>
                <p>
                  If you believe that your protocol should be valid please ask
                  for help via our{' '}
                  <Link
                    href="https://community.networkcanvas.com"
                    target="_blank"
                  >
                    community forum
                  </Link>
                  .
                </p>
              </>
            ),
            additionalContent: (
              <ErrorDetails>
                <>
                  <p>{error.message}</p>
                  <p>Errors:</p>
                  <ul>
                    {error.logicErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {error.schemaErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </>
              </ErrorDetails>
            ),
          });
        }
        // Database errors are thrown inside our tRPC router
        else if (error instanceof DatabaseError) {
          setError({
            title: 'Database error during protocol import',
            description: error.message,
            additionalContent: (
              <ErrorDetails>
                <pre>{error.originalError.toString()}</pre>
              </ErrorDetails>
            ),
          });
        } else {
          setError({
            title: 'Error importing protocol',
            description:
              'There was an unknown error while importing your protocol. The information below might help us to debug the issue.',
            additionalContent: (
              <ErrorDetails>
                <pre>
                  <strong>Message: </strong>
                  {error.message}

                  <strong>Stack: </strong>
                  {error.stack}
                </pre>
              </ErrorDetails>
            ),
          });
        }
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
