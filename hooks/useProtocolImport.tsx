import {
  CURRENT_SCHEMA_VERSION,
  getMigrationInfo,
} from '@codaco/protocol-validation';
import { queue } from 'async';
import { hash } from 'ohash';
import { useCallback, useRef } from 'react';
import { insertProtocol } from '~/actions/protocols';
import Paragraph from '~/components/typography/Paragraph';
import Link from '~/components/ui/Link';
import { useToast } from '~/components/ui/Toast';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '~/fresco.config';
import trackEvent from '~/lib/analytics';
import {
  validateAndMigrateProtocol,
  type ProtocolValidationError,
} from '~/lib/protocol/validateAndMigrateProtocol';
import { uploadFiles } from '~/lib/uploadthing/client-helpers';
import { getNewAssetIds, getProtocolByHash } from '~/queries/protocols';
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

export const useProtocolImport = () => {
  const { toast } = useToast();
  const activeJobs = useRef<Set<string>>(new Set());

  const processJob = async (file: File) => {
    const fileName = file.name;

    try {
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

      const validationResult = await validateAndMigrateProtocol(
        protocolJson,
        dependencies,
      );

      if (!validationResult.success) {
        const errorMessage = getValidationErrorMessage(validationResult);
        toast({
          title: 'Validation Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      const validatedProtocol = validationResult.protocol;

      const protocolHash = hash(validatedProtocol);
      const exists = await getProtocolByHash(protocolHash);
      if (exists) {
        toast({
          title: 'Protocol already exists',
          description:
            'Delete the existing protocol first before importing again.',
          variant: 'destructive',
        });
        return;
      }

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
        const files = newAssets.map((asset) => asset.file);

        const uploadedFiles = await uploadFiles('assetRouter', {
          files,
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

      toast({
        title: 'Protocol imported',
        description: `${fileName} has been imported successfully.`,
        variant: 'success',
      });

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

      toast({
        title: 'Error importing protocol',
        description: error.message,
        variant: 'destructive',
      });

      return;
    } finally {
      activeJobs.current.delete(fileName);
    }
  };

  const jobQueue = useRef(queue(processJob, 2));

  const importProtocols = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const jobAlreadyExists = activeJobs.current.has(file.name);

        if (jobAlreadyExists) {
          // eslint-disable-next-line no-console
          console.warn(`Skipping duplicate job: ${file.name}`);
          return;
        }

        activeJobs.current.add(file.name);

        toast({
          title: 'Importing protocol',
          description: `Processing ${file.name}...`,
        });

        jobQueue.current.push(file).catch((error) => {
          // eslint-disable-next-line no-console
          console.log('jobQueue error', error);
        });
      });
    },
    [toast],
  );

  const cancelAllJobs = useCallback(() => {
    jobQueue.current.pause();
    jobQueue.current.remove(() => true);
    activeJobs.current.clear();
    jobQueue.current.resume();
  }, []);

  const cancelJob = useCallback((id: string) => {
    jobQueue.current.remove(({ data }) => {
      return data.name === id;
    });
    activeJobs.current.delete(id);
  }, []);

  const hasActiveJobs = activeJobs.current.size > 0;

  return {
    importProtocols,
    cancelJob,
    cancelAllJobs,
    hasActiveJobs,
  };
};
