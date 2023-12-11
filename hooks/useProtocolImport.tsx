import { useCallback, useReducer, useRef } from 'react';
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
import { useRouter } from 'next/navigation';
import type { assetInsertSchema } from '~/server/routers/protocol';
import type { z } from 'zod';
import { hash } from 'ohash';

// Utility helper for adding artificial delay to async functions
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useProtocolImport = () => {
  const [jobs, dispatch] = useReducer(jobReducer, jobInitialState);
  const utils = api.useUtils();
  const router = useRouter();

  const { mutateAsync: insertProtocol } = api.protocol.insert.useMutation({
    async onSuccess() {
      await clientRevalidateTag('protocol.get.all');
      await utils.protocol.invalidate();
      router.refresh();
    },
  });

  const { mutateAsync: getProtocolExists } =
    api.protocol.get.byHash.useMutation();

  /**
   * This is the main job processing function. Takes a file, and handles all
   * the steps required to import it into the database, updating the job
   * status as it goes.
   */
  const processJob = async (file: File) => {
    try {
      const fileName = file.name;

      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: fileName,
          status: 'Extracting protocol',
        },
      });

      const fileArrayBuffer = await fileAsArrayBuffer(file);

      // TODO: check if this causes multiple fetches by importing again for each job.
      const JSZip = (await import('jszip')).default; // Dynamic import to reduce bundle size
      const zip = await JSZip.loadAsync(fileArrayBuffer);
      const protocolJson = await getProtocolJson(zip);
      await sleep(1000);

      // Validating protocol...
      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: fileName,
          status: 'Validating protocol',
        },
      });

      const { validateProtocol } = await import('@codaco/protocol-validation');

      const validationResult = await validateProtocol(protocolJson);
      await sleep(1000);

      if (!validationResult.isValid) {
        dispatch({
          type: 'UPDATE_ERROR',
          payload: {
            id: fileName,
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

      // Check if the protocol already exists in the database
      const protocolHash = hash(protocolJson);
      const exists = await getProtocolExists(protocolHash);
      if (exists) {
        dispatch({
          type: 'UPDATE_ERROR',
          payload: {
            id: file.name,
            error: {
              title: 'Protocol already exists',
              description: (
                <AlertDescription>
                  The protocol you attempted to import already exists in the
                  database. Delete the existing protocol first before attempting
                  to import it again.
                </AlertDescription>
              ),
            },
          },
        });

        return;
      }

      const assets = await getProtocolAssets(protocolJson, zip);
      let assetsWithCombinedMetadata: z.infer<typeof assetInsertSchema> = [];

      if (assets.length > 0) {
        dispatch({
          type: 'UPDATE_STATUS',
          payload: {
            id: fileName,
            status: 'Uploading assets',
          },
        });

        const totalBytesToUpload = assets.reduce((acc, asset) => {
          return acc + asset.file.size;
        }, 0);

        const currentBytesUploaded: Record<string, number> = {};

        const uploadedFiles = await uploadFiles({
          files: assets.map((asset) => asset.file),
          endpoint: 'assetRouter',
          onUploadProgress({ progress, file }) {
            const thisFileSize = assets.find((asset) => asset.name === file)!
              .file.size; // eg. 1000

            const thisCompletedBytes = thisFileSize * (progress / 100);

            if (!currentBytesUploaded[file]) {
              currentBytesUploaded[file] = 0;
            }

            currentBytesUploaded[file] = thisCompletedBytes;

            // Sum all totals for all files to calculate overall progress
            const totalUploadedBytes = Object.values(
              currentBytesUploaded,
            ).reduce((acc, cur) => acc + cur, 0);

            const progressPercent = Math.round(
              (totalUploadedBytes / totalBytesToUpload) * 100,
            );

            dispatch({
              type: 'UPDATE_STATUS',
              payload: {
                id: fileName,
                status: 'Uploading assets',
                progress: progressPercent,
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
        assetsWithCombinedMetadata = assets.map((asset) => {
          const uploadedAsset = uploadedFiles.find(
            (uploadedFile) => uploadedFile.name === asset.name,
          );

          if (!uploadedAsset) {
            throw new Error('Asset upload failed', { cause: { code: 500 } });
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
      } else {
        // No assets to upload
        assetsWithCombinedMetadata = [];
      }

      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: fileName,
          status: 'Finishing up',
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
      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: fileName,
          status: 'Complete',
        },
      });

      return;
    } catch (e) {
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
   * Concurrency set to 2 for now. We can increase this because unzipping and
   * validation are basically instant, but the asset upload and db insertion
   * need a separate queue to avoid consuming too much bandwidth or overloading
   * the database.
   */
  const jobQueue = useRef(queue(processJob, 2));

  const importProtocols = (files: File[]) => {
    files.forEach((file) => {
      // Test if there is already a job in the jobQueue with this name
      const jobAlreadyExists = jobs.find((job) => job.id === file.name);

      if (jobAlreadyExists) {
        // eslint-disable-next-line no-console
        console.warn(`Skipping duplicate job: ${file.name}`);
        return;
      }

      dispatch({
        type: 'ADD_JOB',
        payload: {
          file,
        },
      });

      jobQueue.current.push(file).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('jobQueue error', error);
      });
    });
  };

  const cancelAllJobs = useCallback(() => {
    jobQueue.current.pause();
    jobQueue.current.remove(() => true);
    dispatch({
      type: 'CLEAR_JOBS',
    });
    jobQueue.current.resume();
  }, []);

  const cancelJob = useCallback((id: string) => {
    jobQueue.current.remove(({ data }) => {
      return data.name === id;
    });

    dispatch({
      type: 'REMOVE_JOB',
      payload: {
        id,
      },
    });
  }, []);

  return {
    jobs,
    importProtocols,
    cancelJob,
    cancelAllJobs,
  };
};
