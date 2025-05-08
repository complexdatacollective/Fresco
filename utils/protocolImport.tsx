import { type Protocol } from '@codaco/protocol-validation';
import type Zip from 'jszip';
import { type AssetInsertType } from '~/schemas/protocol';

// Fetch protocol.json as a parsed object from the protocol zip.
export const getProtocolJson = async (protocolZip: Zip) => {
  const protocolString = await protocolZip
    ?.file('protocol.json')
    ?.async('string');

  if (!protocolString) {
    throw new Error('protocol.json not found in zip');
  }

  const protocolJson = (await JSON.parse(protocolString)) as Protocol;

  return protocolJson;
};

/**
 * Fetch all assets listed in the protocol json from the protocol zip, and
 * return them as a collection of ProtocolAsset objects, which includes useful
 * metadata about the asset.
 */

type FetchedFileAsset = Omit<
  AssetInsertType,
  'value' | 'key' | 'size' | 'url'
> & { file: File };

interface ProtocolAssetsResult {
  fileAssets: FetchedFileAsset[];
  apikeyAssets: AssetInsertType[];
}

export const getProtocolAssets = async (
  protocolJson: Protocol,
  protocolZip: Zip,
): Promise<ProtocolAssetsResult> => {
  const assetManifest = protocolJson?.assetManifest;

  if (!assetManifest) {
    return { fileAssets: [], apikeyAssets: [] };
  }

  /**
   * Structure of an asset in network canvas protocols:
   *   - An asset in the manifest is an object whose key is a UID.
   *   - The ID property is the same as the key (duplicated for convinience :/)
   *   - Name property is the original file name when added to Architect
   *   - Source property is the internal path to the file in the zip, which is a
   *     separate UID + file extension.
   *   - The type property is one of the NC asset types (e.g. 'image', 'video',
   *     etc.)
   * Assets with type 'apikey' are handled differently:
   *   - They are not actually files. The key itself is stored in the value field.
   */
  const fileAssets: FetchedFileAsset[] = [];
  const apikeyAssets: AssetInsertType[] = [];

  await Promise.all(
    Object.keys(assetManifest).map(async (key) => {
      const asset = assetManifest[key]!;

      // apikey assets are not actually files, so we skip uploading them.
      if (asset.type === 'apikey') {
        const apikeyAsset = {
          assetId: asset.id,
          key: asset.id,
          name: asset.name,
          type: asset.type,
          value: asset.value,
          size: 0,
          url: '',
        } as AssetInsertType;
        apikeyAssets.push(apikeyAsset);
        return;
      }

      const file = await protocolZip
        ?.file(`assets/${asset.source}`)
        ?.async('blob');

      if (!file) {
        throw new Error(
          `Asset "${asset.source}" was not found in asset folder!`,
        );
      }

      fileAssets.push({
        assetId: key,
        name: asset.source,
        type: asset.type,
        file: new File([file], asset.source), // Convert Blob to File with filename
      });
    }),
  );

  return { fileAssets, apikeyAssets };
};

// Helper method for reading a file as an ArrayBuffer. Useful for preparing a
// File to be read by JSZip.
export function fileAsArrayBuffer(file: Blob | File): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('error', (err) => {
      reader.abort();
      // eslint-disable-next-line no-console
      console.log('readFileHelper Error: ', err);
      throw new Error('The file could not be read.');
    });

    reader.addEventListener('load', () => {
      if (!reader.result || typeof reader.result === 'string') {
        throw new Error('The file could not be read.');
      }

      resolve(reader.result);
    });

    reader.readAsArrayBuffer(file);
  });
}
