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
import { clientRevalidateTag } from '~/utils/clientRevalidate';

// Utility helper for adding artificial delay to async functions
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useProtocolImport = () => {
  const [jobs, dispatch] = useReducer(jobReducer, jobInitialState);

  const { mutateAsync: insertProtocol } = api.protocol.insert.useMutation({
    async onSuccess() {
      await clientRevalidateTag('protocol.get.all');
    },
  });

  // const testProcessJob = async (file: File) => {
  //   await new Promise((resolve) => setTimeout(resolve, 3000));

  //   dispatch({
  //     type: 'UPDATE_STATUS',
  //     payload: {
  //       id: file.name,
  //       activeStep: 'Extracting protocol',
  //     },
  //   });

  //   await new Promise((resolve) => setTimeout(resolve, 5000));

  //   dispatch({
  //     type: 'UPDATE_STATUS',
  //     payload: {
  //       id: file.name,
  //       activeStep: 'Complete',
  //     },
  //   });

  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   dispatch({
  //     type: 'REMOVE_JOB',
  //     payload: {
  //       id: file.name,
  //     },
  //   });

  //   return;
  // };

  /**
   * This is the main job processing function. Takes a file, and handles all
   * the steps required to import it into the database, updating the job
   * status as it goes.
   */
  const processJob = async (file: File) => {
    // Small artificial delay to allow for the job card to animate in
    await sleep(1500);

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
      await sleep(1500);

      // Validating protocol...
      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: file.name,
          activeStep: 'Validating protocol',
        },
      });

      const { validateProtocol } = await import('@codaco/protocol-validation');

      const validationResult = await validateProtocol(protocolJson);
      await sleep(1500);

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

      /**
       * We now need to merge the metadata from the uploaded files with the
       * asset metadata from the protocol json, so that we can insert the
       * assets into the database.
       *
       * The 'name' prop matches across both, we can use that to merge them.
       */
      const assetsWithCombinedMetadata = assets.map((asset) => {
        const uploadedAsset = uploadedFiles.find(
          (uploadedFile) => uploadedFile.name === asset.name,
        );

        if (!uploadedAsset) {
          throw new Error('Asset upload failed');
        }

        // Ensure this matches the input schema in the protocol router
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
        assets: assetsWithCombinedMetadata,
      });

      if (result.error) {
        throw new DatabaseError(result.error, result.errorDetails);
      }

      // Complete! 🚀
      return;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      const error = ensureError(e);

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

  /**
   * Create an async processing que for import jobs, to allow for multiple
   * protocols to be imported with a nice UX.
   *
   * Concurrency set to 1 for now. We can increase this because unzipping and
   * validation are basically instant, but the asset upload and db insertion
   * need a separate queue to avoid consuming too much bandwidth or overloading
   * the database.
   */
  const jobQueue = queue(processJob, 1);

  const importProtocols = (files: File[]) => {
    files.forEach((file) => {
      dispatch({
        type: 'ADD_JOB',
        payload: {
          file,
        },
      });

      jobQueue.push(file).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('jobQueue error', error);
      });
    });
  };

  const cancelAllJobs = () => {
    jobQueue.kill();
  };

  const cancelJob = (id: string) => {
    jobQueue.remove(({ data }) => data.name === id);
    dispatch({
      type: 'REMOVE_JOB',
      payload: {
        id,
      },
    });
  };

  return {
    jobs,
    importProtocols,
    cancelJob,
    cancelAllJobs,
  };
};
