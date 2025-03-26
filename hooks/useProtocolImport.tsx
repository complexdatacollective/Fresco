import { validateProtocol } from '@codaco/protocol-validation';
import { queue } from 'async';
import { XCircle } from 'lucide-react';
import { hash } from 'ohash';
import { useCallback, useReducer, useRef } from 'react';
import { insertProtocol } from '~/actions/protocols';
import { ErrorDetails } from '~/components/ErrorDetails';
import Link from '~/components/Link';
import {
  jobInitialState,
  jobReducer,
} from '~/components/ProtocolImport/JobReducer';
import { AlertDialogDescription } from '~/components/ui/AlertDialog';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';
import { uploadFiles } from '~/lib/uploadthing-client-helpers';
import { getNewAssetIds, getProtocolByHash } from '~/queries/protocols';
import { type AssetInsertType } from '~/schemas/protocol';
import { DatabaseError } from '~/utils/databaseError';
import { ensureError } from '~/utils/ensureError';
import {
  fileAsArrayBuffer,
  getProtocolAssets,
  getProtocolJson,
} from '~/utils/protocolImport';

/**
 * Formats a list of numbers into a human-readable string.
 */
export function formatNumberList(numbers: number[]): string {
  // "1"
  if (numbers.length === 1) {
    return numbers[0]!.toString();
  }

  // "1 and 2"
  if (numbers.length === 2) {
    return numbers.join(' and ');
  }

  // "1, 2, and 3"
  const lastNumber = numbers.pop();
  const formattedList = numbers.join(', ') + `, and ${lastNumber}`;

  return formattedList;
}

export const useProtocolImport = () => {
  const [jobs, dispatch] = useReducer(jobReducer, jobInitialState);

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

      // Validating protocol...
      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: fileName,
          status: 'Validating protocol',
        },
      });

      // Check if the protocol version is compatible with the app.
      const protocolVersion = protocolJson.schemaVersion;
      if (!APP_SUPPORTED_SCHEMA_VERSIONS.includes(protocolVersion)) {
        dispatch({
          type: 'UPDATE_ERROR',
          payload: {
            id: fileName,
            rawError: new Error('Protocol version not supported'),
            error: {
              title: 'Protocol version not supported',
              description: (
                <AlertDialogDescription>
                  The protocol you uploaded is not compatible with this version
                  of the app. Fresco supports protocols using version number
                  {APP_SUPPORTED_SCHEMA_VERSIONS.length > 1 ? 's' : ''}{' '}
                  {formatNumberList(APP_SUPPORTED_SCHEMA_VERSIONS)}.
                </AlertDialogDescription>
              ),
            },
          },
        });

        return;
      }

      const validationResult = await validateProtocol(protocolJson);

      if (!validationResult.isValid) {
        const resultAsString = JSON.stringify(validationResult, null, 2);

        dispatch({
          type: 'UPDATE_ERROR',
          payload: {
            id: fileName,
            rawError: new Error('Protocol validation failed', {
              cause: validationResult,
            }),
            error: {
              title: 'The protocol is invalid!',
              description: (
                <>
                  <AlertDialogDescription>
                    The protocol you uploaded is invalid. See the details below
                    for specific validation errors that were found.
                  </AlertDialogDescription>
                  <AlertDialogDescription>
                    If you believe that your protocol should be valid please ask
                    for help via our{' '}
                    <Link
                      href="https://community.networkcanvas.com"
                      target="_blank"
                    >
                      community forum
                    </Link>
                    .
                  </AlertDialogDescription>
                </>
              ),
              additionalContent: (
                <ErrorDetails errorText={resultAsString}>
                  <ul className="max-w-md list-inside space-y-2">
                    {[
                      ...validationResult.schemaErrors,
                      ...validationResult.logicErrors,
                    ].map((validationError, i) => (
                      <li className="flex capitalize" key={i}>
                        <XCircle className="text-destructive mr-2 h-4 w-4" />
                        <span>
                          {validationError.message}{' '}
                          <span className="text-xs italic">
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
      const exists = await getProtocolByHash(protocolHash);
      if (exists) {
        dispatch({
          type: 'UPDATE_ERROR',
          payload: {
            id: file.name,
            rawError: new Error('Protocol already exists'),
            error: {
              title: 'Protocol already exists',
              description: (
                <AlertDialogDescription>
                  The protocol you attempted to import already exists in the
                  database. Delete the existing protocol first before attempting
                  to import it again.
                </AlertDialogDescription>
              ),
            },
          },
        });

        return;
      }

      const { fileAssets, apikeyAssets } = await getProtocolAssets(
        protocolJson,
        zip,
      );

      const newAssets: typeof fileAssets = [];
      const existingAssetIds: string[] = [];
      let newAssetsWithCombinedMetadata: AssetInsertType[] = [];
      const newApikeyAssets: typeof apikeyAssets = [];

      // Check if the assets are already in the database.
      // If yes, add them to existingAssetIds to be connected to the protocol.
      // If not, add files to newAssets to be uploaded
      // and add apikeys to newApikeyAssets to be created in the database with the protocol
      try {
        const newFileAssetIds = await getNewAssetIds(
          fileAssets.map((asset) => asset.assetId),
        );

        fileAssets.forEach((asset) => {
          if (newFileAssetIds.includes(asset.assetId)) {
            newAssets.push(asset);
          } else {
            existingAssetIds.push(asset.assetId);
          }
        });

        const newApikeyAssetIds = await getNewAssetIds(
          apikeyAssets.map((apiKey) => apiKey.assetId),
        );

        apikeyAssets.forEach((apiKey) => {
          if (newApikeyAssetIds.includes(apiKey.assetId)) {
            newApikeyAssets.push(apiKey);
          } else {
            existingAssetIds.push(apiKey.assetId);
          }
        });
      } catch (e) {
        throw new Error('Error checking for existing assets');
      }

      // Upload the new assets

      if (newAssets.length > 0) {
        dispatch({
          type: 'UPDATE_STATUS',
          payload: {
            id: fileName,
            status: 'Uploading assets',
          },
        });

        /**
         * To track overall upload progress we need to create two variables in
         * the upper scope, one to track the total bytes to upload, and one to
         * track the current bytes uploaded per file (uploads are done in
         * parallel).
         */
        const totalBytesToUpload = newAssets.reduce((acc, asset) => {
          return acc + asset.file.size;
        }, 0);

        const currentBytesUploaded: Record<string, number> = {};

        const files = newAssets.map((asset) => asset.file);

        const uploadedFiles = await uploadFiles('assetRouter', {
          files,
          onUploadProgress({ progress, file }) {
            const thisFileSize = newAssets.find(
              (asset) => asset.name === file.name,
            )!.file.size; // eg. 1000

            const thisCompletedBytes = thisFileSize * (progress / 100);

            if (!currentBytesUploaded[file.name]) {
              currentBytesUploaded[file.name] = 0;
            }

            currentBytesUploaded[file.name] = thisCompletedBytes;

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
         * newassets into the database.
         *
         * The 'name' prop matches across both - we can use that to merge them.
         */
        newAssetsWithCombinedMetadata = newAssets.map((asset) => {
          const uploadedAsset = uploadedFiles.find(
            (uploadedFile) => uploadedFile.name === asset.name,
          );

          if (!uploadedAsset) {
            throw new Error('Asset upload failed');
          }

          // Ensure this matches the input schema in the protocol router by
          // manually constructing the object.
          return {
            key: uploadedAsset.key,
            assetId: asset.assetId,
            name: asset.name,
            type: asset.type,
            url: uploadedAsset.ufsUrl,
            size: uploadedAsset.size,
          };
        });
      }

      dispatch({
        type: 'UPDATE_STATUS',
        payload: {
          id: fileName,
          status: 'Writing to database',
        },
      });

      const result = await insertProtocol({
        protocol: protocolJson,
        protocolName: fileName,
        newAssets: [...newAssetsWithCombinedMetadata, ...newApikeyAssets],
        existingAssetIds: existingAssetIds,
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
            rawError: error,
            error: {
              title: 'Database error during protocol import',
              description: (
                <AlertDialogDescription>{error.message}</AlertDialogDescription>
              ),
              additionalContent: (
                <ErrorDetails errorText={error.originalError.toString()}>
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
            rawError: error,
            error: {
              title: 'Error importing protocol',
              description: (
                <AlertDialogDescription>
                  There was an unknown error while importing your protocol. The
                  information below might help us to debug the issue.
                </AlertDialogDescription>
              ),
              additionalContent: (
                <ErrorDetails errorText={JSON.stringify(error, null, 2)}>
                  <pre>{error.message}</pre>
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
