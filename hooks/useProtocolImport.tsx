'use client';

import {
  CURRENT_SCHEMA_VERSION,
  getMigrationInfo,
} from '@codaco/protocol-validation';
import { queue } from 'async';
import { hash } from 'ohash';
import { useCallback, useEffect, useRef } from 'react';
import {
  getNewAssetIds,
  getProtocolByHash,
  insertProtocol,
} from '~/actions/protocols';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';
import trackEvent from '~/lib/analytics';
import { useProtocolImportStoreApi } from '~/lib/protocol-import/useProtocolImportStore';
import {
  validateAndMigrateProtocol,
  type ProtocolValidationError,
} from '~/lib/protocol/validateAndMigrateProtocol';
import { uploadFiles } from '~/lib/uploadthing/client-helpers';
import { type AssetInsertType } from '~/schemas/protocol';
import { DatabaseError } from '~/utils/databaseError';
import { ensureError } from '~/utils/ensureError';
import {
  fileAsArrayBuffer,
  getProtocolAssets,
  getProtocolJson,
} from '~/utils/protocolImport';

function formatNumberList(numbers: number[]): string {
  if (numbers.length === 1) {
    return numbers[0]!.toString();
  }

  if (numbers.length === 2) {
    return numbers.join(' and ');
  }

  const lastNumber = numbers.pop();
  const formattedList = numbers.join(', ') + `, and ${lastNumber}`;

  return formattedList;
}

function getValidationErrorMessage(
  validationError: ProtocolValidationError,
): string {
  switch (validationError.error) {
    case 'invalid-object':
      return 'The uploaded file does not contain a valid protocol.';
    case 'unsupported-version':
      return `Protocol version not supported. Fresco supports version${APP_SUPPORTED_SCHEMA_VERSIONS.length > 1 ? 's' : ''} ${formatNumberList([...APP_SUPPORTED_SCHEMA_VERSIONS])}.`;
    case 'validation-failed':
      return 'The protocol is invalid. Please check the protocol structure.';
    case 'missing-dependencies':
      return `Migration failed: missing ${validationError.missingDependencies.join(', ')}.`;
  }
}

function generateJobId(): string {
  return `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useProtocolImport = () => {
  const store = useProtocolImportStoreApi();
  const activeJobs = useRef<Set<string>>(new Set());

  const processJob = async ({ file, jobId }: { file: File; jobId: string }) => {
    const fileName = file.name;
    const state = store.getState();

    try {
      // Phase: Parsing
      state.updateJobPhase(jobId, 'parsing');
      const fileArrayBuffer = await fileAsArrayBuffer(file);

      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(fileArrayBuffer);
      const protocolJson = await getProtocolJson(zip);

      const dependencies: Record<string, unknown> = {};
      if (protocolJson.schemaVersion < CURRENT_SCHEMA_VERSION) {
        const migrationInfo = getMigrationInfo(
          protocolJson.schemaVersion,
          CURRENT_SCHEMA_VERSION,
        );
        for (const dep of migrationInfo.dependencies) {
          if (dep === 'name') {
            dependencies.name = fileName.replace(/\.netcanvas$/i, '');
          }
        }
      }

      // Phase: Validating
      state.updateJobPhase(jobId, 'validating');
      const validationResult = await validateAndMigrateProtocol(
        protocolJson,
        dependencies,
      );

      if (!validationResult.success) {
        const errorMessage = getValidationErrorMessage(validationResult);
        state.setJobError(jobId, errorMessage);
        return;
      }

      const validatedProtocol = validationResult.protocol;

      // Phase: Checking duplicates
      state.updateJobPhase(jobId, 'checking-duplicates');
      const protocolHash = hash(validatedProtocol);
      const exists = await getProtocolByHash(protocolHash);
      if (exists) {
        state.setJobError(
          jobId,
          'Protocol already exists. Delete the existing protocol first before importing again.',
        );
        return;
      }

      // Phase: Extracting assets
      state.updateJobPhase(jobId, 'extracting-assets');
      const { fileAssets, apikeyAssets } = await getProtocolAssets(
        validatedProtocol,
        zip,
      );

      const newAssets: typeof fileAssets = [];
      const existingAssetIds: string[] = [];
      let newAssetsWithCombinedMetadata: AssetInsertType[] = [];
      const newApikeyAssets: typeof apikeyAssets = [];

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
      } catch (_e) {
        throw new Error('Error checking for existing assets');
      }

      if (newAssets.length > 0) {
        // Phase: Uploading assets
        state.updateJobPhase(jobId, 'uploading-assets');
        const files = newAssets.map((asset) => asset.file);

        const uploadedFiles = await uploadFiles('assetRouter', {
          files,
          onUploadProgress: ({ progress }) => {
            state.updateJobProgress(jobId, progress);
          },
        });

        newAssetsWithCombinedMetadata = newAssets.map((asset) => {
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
            url: uploadedAsset.ufsUrl,
            size: uploadedAsset.size,
          };
        });
      }

      // Phase: Saving
      state.updateJobPhase(jobId, 'saving');
      const result = await insertProtocol({
        protocol: validatedProtocol,
        protocolName: fileName,
        newAssets: [...newAssetsWithCombinedMetadata, ...newApikeyAssets],
        existingAssetIds: existingAssetIds,
      });

      if (result.error) {
        throw new DatabaseError(result.error, result.errorDetails);
      }

      void trackEvent({
        type: 'ProtocolInstalled',
        metadata: {
          protocol: fileName,
        },
      });

      // Phase: Complete
      state.updateJobPhase(jobId, 'complete');

      return;
    } catch (e) {
      const error = ensureError(e);

      void trackEvent({
        type: 'Error',
        name: error.name,
        message: error.message,
        stack: error.stack,
        metadata: {
          path: '/hooks/useProtocolImport.tsx',
        },
      });

      state.setJobError(jobId, error.message);

      return;
    } finally {
      activeJobs.current.delete(fileName);
    }
  };

  const jobQueue = useRef(queue(processJob, 2));

  const importProtocols = useCallback(
    (files: File[]) => {
      const state = store.getState();

      // Open the dialog when import starts
      state.openDialog();

      files.forEach((file) => {
        const jobAlreadyExists = activeJobs.current.has(file.name);

        if (jobAlreadyExists) {
          // eslint-disable-next-line no-console
          console.warn(`Skipping duplicate job: ${file.name}`);
          return;
        }

        activeJobs.current.add(file.name);

        const jobId = generateJobId();
        state.addJob(jobId, file.name, file);

        jobQueue.current.push({ file, jobId }).catch((error) => {
          // eslint-disable-next-line no-console
          console.log('jobQueue error', error);
        });
      });
    },
    [store],
  );

  // Listen for retry events from the dialog
  useEffect(() => {
    const handleRetry = (event: CustomEvent<{ file: File }>) => {
      importProtocols([event.detail.file]);
    };

    window.addEventListener(
      'protocol-import-retry',
      handleRetry as EventListener,
    );
    return () => {
      window.removeEventListener(
        'protocol-import-retry',
        handleRetry as EventListener,
      );
    };
  }, [importProtocols]);

  const cancelAllJobs = useCallback(() => {
    jobQueue.current.pause();
    jobQueue.current.remove(() => true);
    activeJobs.current.clear();
    jobQueue.current.resume();
  }, []);

  const cancelJob = useCallback((id: string) => {
    jobQueue.current.remove(({ data }) => {
      return data.file.name === id;
    });
    activeJobs.current.delete(id);
  }, []);

  const hasActiveJobs = useCallback(() => {
    return store.getState().hasActiveJobs();
  }, [store]);

  return {
    importProtocols,
    cancelJob,
    cancelAllJobs,
    hasActiveJobs,
  };
};
