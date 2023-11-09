import { useReducer } from 'react';
import { uploadFiles } from '~/lib/uploadthing-helpers';
import { api } from '~/trpc/client';
import { DatabaseError } from '~/utils/databaseError';
import { ensureError } from '~/utils/ensureError';
import { queue } from 'async';
import {
  fileAsArrayBuffer,
  getProtocolJson,
  getProtocolAssets,
} from '~/utils/protocolImport';
import {
  jobInitialState,
  jobReducer,
} from '~/components/ProtocolImport/JobReducer';
import { AlertDescription } from '~/components/ui/Alert';
import Link from '~/components/Link';
import { ErrorDetails } from '~/components/ErrorDetails';
import { XCircle } from 'lucide-react';

export type ErrorState = {
  title: string;
  description: React.ReactNode;
  additionalContent?: React.ReactNode;
};

export const useProtocolImport = () => {
  const { mutateAsync: insertProtocol } = api.protocol.insert.useMutation();
  const [jobs, dispatch] = useReducer(jobReducer, jobInitialState);

  const processJob = async (file: File) => {
    try {
      const fileName = file.name;

      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: file.name,
          activeStep: 'Extracting protocol',
        },
      });

      const fileArrayBuffer = await fileAsArrayBuffer(file);

      // TODO: check if this causes multiple fetches by importing again for each job.
      const JSZip = (await import('jszip')).default; // Dynamic import to reduce bundle size
      const zip = await JSZip.loadAsync(fileArrayBuffer);
      const protocolJson = await getProtocolJson(zip);

      // Validating protocol...
      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: file.name,
          activeStep: 'Validating protocol',
        },
      });

      const { validateProtocol } = await import('@codaco/protocol-validation');

      // This function will throw on validation errors, with type ValidationError
      const validationResult = await validateProtocol(protocolJson);

      if (!validationResult.isValid) {
        // eslint-disable-next-line no-console
        console.log('validationResult', validationResult);

        dispatch({
          type: 'UPDATE_ERROR',
          payload: {
            id: file.name,
            error: {
              title: 'The protocol is invalid!',
              description: (
                <>
                  <AlertDescription>
                    The protocol you uploaded is invalid. See the details below
                    for specific validation errors that were found.
                  </AlertDescription>
                  <AlertDescription>
                    If you believe that your protocol should be valid please ask
                    for help via our{' '}
                    <Link
                      href="https://community.networkcanvas.com"
                      target="_blank"
                    >
                      community forum
                    </Link>
                    .
                  </AlertDescription>
                </>
              ),
              additionalContent: (
                <ErrorDetails>
                  <ul className="max-w-md list-inside space-y-2 text-white">
                    {[
                      ...validationResult.schemaErrors,
                      ...validationResult.logicErrors,
                    ].map((validationError, i) => (
                      <li className="flex capitalize" key={i}>
                        <XCircle className="mr-2 h-4 w-4 fill-red-500 stroke-white" />
                        <span>
                          {validationError.message}{' '}
                          <span className="text-xs italic text-gray-500">
                            ({validationError.path})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </ErrorDetails>
              ),
            },
          },
        });

        return;
      }

      // After this point, assume the protocol is valid.
      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: file.name,
          activeStep: 'Uploading assets',
          progress: 0,
        },
      });

      const assets = await getProtocolAssets(protocolJson, zip);

      // Calculate overall asset upload progress by summing the progress
      // of each asset, then dividing by the total number of assets * 100.
      const completeCount = assets.length * 100;
      let currentProgress = 0;

      const uploadedFiles = await uploadFiles({
        files: assets.map((asset) => asset.file),
        endpoint: 'assetRouter',
        onUploadProgress({ progress }) {
          currentProgress += progress;
          dispatch({
            type: 'UPDATE_STATUS',
            payload: {
              id: file.name,
              activeStep: 'Uploading assets',
              progress: Math.round((currentProgress / completeCount) * 100),
            },
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

      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: file.name,
          activeStep: 'Finishing up',
        },
      });

      const result = await insertProtocol({
        protocol: protocolJson,
        protocolName: fileName,
        assets: assetsWithUploadMeta,
      });

      if (result.error) {
        throw new DatabaseError(result.error, result.errorDetails);
      }

      dispatch({
        type: 'REMOVE_JOB',
        payload: {
          id: file.name,
        },
      });
      return;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);

      const error = ensureError(e);
      // Database errors are thrown inside our tRPC router
      if (error instanceof DatabaseError) {
        dispatch({
          type: 'UPDATE_ERROR',
          payload: {
            id: file.name,
            error: {
              title: 'Database error during protocol import',
              description: <AlertDescription>{error.message}</AlertDescription>,
              additionalContent: (
                <ErrorDetails>
                  <pre>{error.originalError.toString()}</pre>
                </ErrorDetails>
              ),
            },
          },
        });
      } else {
        dispatch({
          type: 'UPDATE_ERROR',
          payload: {
            id: file.name,
            error: {
              title: 'Error importing protocol',
              description: (
                <AlertDescription>
                  There was an unknown error while importing your protocol. The
                  information below might help us to debug the issue.
                </AlertDescription>
              ),
              additionalContent: (
                <ErrorDetails>
                  <pre className="whitespace-pre-wrap">{error.message}</pre>
                </ErrorDetails>
              ),
            },
          },
        });
      }

      return;
    }
  };

  const jobQueue = queue(processJob, 1);

  const importProtocols = async (files: File[]) => {
    files.forEach(async (file) => {
      dispatch({
        type: 'ADD_JOB',
        payload: {
          file,
        },
      });
      await jobQueue.push(file);
    });
  };

  const reset = () => {};

  return {
    jobs,
    reset,
    importProtocols,
  };
};
