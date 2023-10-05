'use server';
import type { Asset } from '@prisma/client';
import { hash } from 'bcrypt';
import type Zip from 'jszip';
import JSZip from 'jszip';
import type { UploadFileResponse } from 'uploadthing/client';
import type { FileEsque } from 'uploadthing/dist/sdk/utils';
import { utapi } from 'uploadthing/server';
import type {
  AssetManifest,
  Protocol as NCProtocol,
} from '~/lib/shared-consts';
import { prisma } from '~/utils/db';
import schemas from '@codaco/protocol-validation';

const getValidatorForSchemaVersion = (schemaVersion: number) =>
  schemas.find((schema) => schema.version === schemaVersion)?.validator;

class ValidationError extends Error {
  constructor(
    message: string,
    public dataErrors: string[],
    public schemaErrors: string[],
  ) {
    super(message);
  }
}

// Move to utils
export const fetchFileAsBuffer = async (url: string) => {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  return buffer;
};

export const getProtocolJson = async (zip: Zip) => {
  const protocolString = await zip.file('protocol.json')?.async('string');

  if (!protocolString) {
    throw new Error('protocol.json not found in zip');
  }

  const protocol = await JSON.parse(protocolString);

  return protocol;
};

export const validateProtocolJson = async (protocol: NCProtocol) => {
  const validator = getValidatorForSchemaVersion(protocol.schemaVersion);

  if (!validator) {
    throw new Error('No validator found for schema version');
  }

  if (!validator(protocol)) {
    console.log('errorsList', validator.errors);
    throw new ValidationError('Protocol failed validation', [], []);
  }

  console.log('Protocol is valid!');

  return;
};

export const uploadProtocolAssets = async (protocol: NCProtocol, zip: Zip) => {
  const assetManifest = protocol.assetManifest as AssetManifest;

  if (!assetManifest) {
    return;
  }

  const data = new FormData();

  await Promise.all(
    Object.keys(assetManifest).map(async (key) => {
      const asset = assetManifest[key] as Asset;

      const fileParts = asset.source.split('.');
      const fileExtension = fileParts[fileParts.length - 1];

      const blob = await zip.file(`assets/${asset.source}`)?.async('blob');

      if (!blob) {
        throw new Error('Asset not found in asset folder!');
      }

      const file = new Blob([blob], {
        type: `application/${fileExtension}`,
      }) as FileEsque;

      data.append('files', file, `${asset.id}.${fileExtension}`);
    }),
  );

  const files = data.getAll('files') as FileEsque[];

  const response = await utapi.uploadFiles(files);

  const assets = response.map((uploadedFile) => {
    const assetKey = uploadedFile?.data?.name.split('.')[0];

    if (
      uploadedFile.error ||
      !uploadedFile.data.name ||
      !assetKey ||
      !assetManifest[assetKey]
    ) {
      throw new Error('incomplete file uploads: name mismatch');
    }

    const asset = assetManifest[assetKey];

    if (!asset?.name) {
      throw new Error('incomplete file uploads: name mismatch');
    }

    const { id, ...otherAssetAttributes } = asset;

    return {
      assetId: id as string,
      ...otherAssetAttributes,
      ...uploadedFile.data,
      alias: asset.name,
    };
  });

  return assets;
};

export const insertProtocol = async (
  protocolName: string,
  protocol: NCProtocol,
  assets: Asset[] | undefined,
) => {
  try {
    const protocolHash = await hash(JSON.stringify(protocol), 8);

    // eslint-disable-next-line local-rules/require-data-mapper
    await prisma.protocol.create({
      data: {
        hash: protocolHash,
        lastModified: protocol.lastModified,
        name: protocolName,
        schemaVersion: protocol.schemaVersion,
        stages: JSON.stringify(protocol.stages),
        codebook: JSON.stringify(protocol.codebook),
        description: protocol.description,
        assets: {
          create: assets,
        },
      },
    });
  } catch (e) {
    throw new Error('Error adding to database');
  }
};

export const removeProtocolFromCloudStorage = async (fileKey: string) => {
  const response = await utapi.deleteFiles(fileKey);
  return response;
};

export const importProtocol = async (file: UploadFileResponse) => {
  try {
    const protocolName = file.name.split('.')[0]!;

    // Preparing protocol...
    const buffer = await fetchFileAsBuffer(file.url);

    // Unzipping...
    const zip = await JSZip.loadAsync(buffer);

    const protocolJson = (await getProtocolJson(zip)) as NCProtocol;

    // Validating protocol...
    try {
      await validateProtocolJson(protocolJson);
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          error: 'The protocol is invalid',
          errorDetails: [...error.dataErrors, ...error.schemaErrors],
          success: false,
        };
      }

      throw error;
    }

    // Uploading assets...
    const assets = (await uploadProtocolAssets(protocolJson, zip)) as Asset[];

    // Inserting protocol...
    await insertProtocol(protocolName, protocolJson, assets);

    // Removing protocol file...');
    await removeProtocolFromCloudStorage(file.key);

    // Done!
    return { error: null, success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, success: false };
    }

    return { error: 'Unknown error', success: false };
  }
};
