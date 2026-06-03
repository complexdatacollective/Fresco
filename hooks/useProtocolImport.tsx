'use client';

import {
  CURRENT_SCHEMA_VERSION,
  getMigrationInfo,
  hashProtocol,
} from '@codaco/protocol-validation';
import { queue } from 'async';
import posthog from 'posthog-js';
import { useCallback, useRef } from 'react';
import {
  cleanupUploadedFiles,
  getNewAssetIds,
  getProtocolByHash,
  insertProtocol,
} from '~/actions/protocols';
import {
  calculateImportProgress,
  type ImportPhase,
} from '~/components/ProtocolImport/calculateImportProgress';
import ImportToastContent from '~/components/ProtocolImport/ImportToastContent';
import { useToast } from '@codaco/fresco-ui/Toast';
import {
  APP_SUPPORTED_SCHEMA_VERSIONS,
  PROTOCOL_UPLOAD_PART_BYTES,
} from '~/fresco.config';
import { splitFileIntoParts } from '~/lib/protocol/splitFileIntoParts';
import {
  validateAndMigrateProtocol,
  type ProtocolValidationError,
} from '~/lib/protocol/validateAndMigrateProtocol';
import { useUploadAssets } from '~/hooks/useUploadAssets';
import Spinner from '@codaco/fresco-ui/Spinner';
import { type AssetInsertType } from '~/schemas/protocol';
import { getProtocolSizeError } from '~/utils/protocolSize';
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
  const { add, update, close } = useToast();
  const { uploadAssets } = useUploadAssets();
  const activeJobs = useRef<Set<string>>(new Set());
  // Store refs to toast manager functions so the queue callback can access them
  // without being recreated when toast manager changes
  const toastRef = useRef({ add, update, close });
  toastRef.current = { add, update, close };

  const updateToastPhase = (
    toastId: string,
    phase: ImportPhase,
    phaseProgress = 0,
    error?: string | null,
    onRetry?: () => void,
  ) => {
    const progress = calculateImportProgress(phase, phaseProgress);
    const { update: toastUpdate } = toastRef.current;

    if (phase === 'complete') {
      toastUpdate(toastId, {
        variant: 'success',
        title: 'Protocol imported successfully',
        description: `Protocol ${toastId} has been imported.`,
        icon: null,
        timeout: 2000,
      });
      return;
    }

    if (phase === 'error') {
      toastUpdate(toastId, {
        variant: 'destructive',
        icon: null,
        description: (
          <ImportToastContent
            phase={phase}
            progress={progress}
            error={error}
            onRetry={onRetry}
          />
        ),
        timeout: 0,
      });
      return;
    }

    toastUpdate(toastId, {
      description: <ImportToastContent phase={phase} progress={progress} />,
    });
  };

  const processJob = async ({
    file,
    toastId,
  }: {
    file: File;
    toastId: string;
  }) => {
    const fileName = file.name;

    const retryThisFile = () => {
      importProtocols([file]);
    };

    // Storage keys of every blob uploaded during this attempt, so they can be
    // cleaned up on a best-effort basis if the import fails partway through.
    const uploadedKeys: string[] = [];

    try {
      // Phase: Parsing
      updateToastPhase(toastId, 'parsing');
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
      updateToastPhase(toastId, 'validating');
      const validationResult = await validateAndMigrateProtocol(
        protocolJson,
        dependencies,
      );

      if (!validationResult.success) {
        const errorMessage = getValidationErrorMessage(validationResult);
        updateToastPhase(toastId, 'error', 0, errorMessage, retryThisFile);
        return;
      }

      const validatedProtocol = validationResult.protocol;

      // Phase: Checking duplicates
      updateToastPhase(toastId, 'checking-duplicates');
      const protocolHash = hashProtocol(validatedProtocol);
      const exists = await getProtocolByHash(protocolHash);
      if (exists) {
        updateToastPhase(
          toastId,
          'error',
          0,
          'Protocol already exists. Delete the existing protocol first before importing again.',
          retryThisFile,
        );
        return;
      }

      // Phase: Extracting assets
      updateToastPhase(toastId, 'extracting-assets');
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

      // Phase: Uploading protocol (split into pieces for reliable upload)
      updateToastPhase(toastId, 'uploading-protocol');

      const protocolParts = splitFileIntoParts(
        file,
        PROTOCOL_UPLOAD_PART_BYTES,
      );
      const uploadedParts = await uploadAssets(protocolParts, (progress) => {
        updateToastPhase(toastId, 'uploading-protocol', progress);
      });

      uploadedKeys.push(...uploadedParts.map((part) => part.key));

      const originalFileParts = protocolParts.map((part) => {
        const uploaded = uploadedParts.find((u) => u.name === part.name);
        if (!uploaded) {
          throw new Error('Protocol file part upload result mismatch');
        }
        return { key: uploaded.key, url: uploaded.url, size: uploaded.size };
      });

      // Phase: Uploading assets
      updateToastPhase(toastId, 'uploading-assets');

      const uploadedAssetFiles = newAssets.length
        ? await uploadAssets(
            newAssets.map((asset) => asset.file),
            (progress) => {
              updateToastPhase(toastId, 'uploading-assets', progress);
            },
          )
        : [];

      uploadedKeys.push(
        ...uploadedAssetFiles.map((uploadedFile) => uploadedFile.key),
      );

      newAssetsWithCombinedMetadata = newAssets.map((asset) => {
        const uploadedAsset = uploadedAssetFiles.find(
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

      // Phase: Saving
      updateToastPhase(toastId, 'saving');
      const result = await insertProtocol({
        protocol: validatedProtocol,
        protocolName: fileName,
        newAssets: [...newAssetsWithCombinedMetadata, ...newApikeyAssets],
        existingAssetIds: existingAssetIds,
        originalFileParts,
      });

      if (result.error) {
        throw new DatabaseError(result.error, result.errorDetails);
      }

      posthog.capture('ProtocolInstalled', {
        protocol: fileName,
      });

      // Phase: Complete
      updateToastPhase(toastId, 'complete');

      return;
    } catch (e) {
      const error = ensureError(e);

      posthog.captureException(error);

      // Best-effort cleanup of any blobs uploaded before the failure, so a
      // failed import doesn't leave orphaned files in storage.
      if (uploadedKeys.length > 0) {
        void cleanupUploadedFiles(uploadedKeys);
      }

      updateToastPhase(toastId, 'error', 0, error.message, retryThisFile);

      return;
    } finally {
      activeJobs.current.delete(fileName);
    }
  };

  const jobQueue = useRef(queue(processJob, 2));

  const importProtocols = useCallback((files: File[]) => {
    files.forEach((file) => {
      const sizeError = getProtocolSizeError(file);
      if (sizeError) {
        toastRef.current.add({
          id: generateJobId(),
          variant: 'destructive',
          title: file.name,
          description: sizeError,
          timeout: 0,
        });
        return;
      }

      const jobAlreadyExists = activeJobs.current.has(file.name);

      if (jobAlreadyExists) {
        // eslint-disable-next-line no-console
        console.warn(`Skipping duplicate job: ${file.name}`);
        return;
      }

      activeJobs.current.add(file.name);

      const toastId = generateJobId();
      toastRef.current.add({
        id: toastId,
        title: file.name,
        description: <ImportToastContent phase="parsing" progress={0} />,
        icon: <Spinner size="xs" />,
        timeout: 0,
      });

      jobQueue.current.push({ file, toastId }).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('jobQueue error', error);
      });
    });
  }, []);

  return {
    importProtocols,
  };
};
