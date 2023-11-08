import type { AssetManifest, Protocol } from '@codaco/shared-consts';
import type Zip from 'jszip';

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

type ProtocolAsset = {
  assetId: string;
  name: string;
  type: string;
  file: File;
};

export const getProtocolAssets = async (
  protocolJson: Protocol,
  protocolZip: Zip,
) => {
  const assetManifest = protocolJson?.assetManifest as AssetManifest;

  if (!assetManifest) {
    return [];
  }

  /**
   * Structure of an Asset:
   *   - Asset is an object. Key is the UID.
   *   - ID property is the same as the key.
   *   - Name property is the original file name when added to Architect
   *   - Source property is the internal path to the file in the zip, which is a
   *     separate UID + file extension.
   *   - The type property is one of the NC asset types (e.g. 'image', 'video', etc.)
   */

  const files: ProtocolAsset[] = [];

  await Promise.all(
    Object.keys(assetManifest).map(async (key) => {
      const asset = assetManifest[key]!;

      const file = await protocolZip
        ?.file(`assets/${asset.source}`)
        ?.async('blob');

      if (!file) {
        throw new Error(
          `Asset "${asset.source}" was not found in asset folder!`,
        );
      }

      // data.append('files', file, asset.source);
      files.push({
        assetId: key,
        name: asset.source,
        type: asset.type,
        file: new File([file], asset.source),
      });
    }),
  );

  return files;
};

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
