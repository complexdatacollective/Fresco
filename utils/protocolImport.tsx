import type { AssetManifest, Protocol } from '@codaco/shared-consts';
import type Zip from 'jszip';

export type FileEsque = Blob & {
  name: string;
};

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

export const getAssets = async (protocolJson: Protocol, protocolZip: Zip) => {
  const assetManifest = protocolJson?.assetManifest as AssetManifest;

  if (!assetManifest) {
    return [];
  }

  const data = new FormData();

  await Promise.all(
    Object.keys(assetManifest).map(async (key) => {
      const asset = assetManifest[key]!;

      const file = (await protocolZip
        ?.file(`assets/${asset.source}`)
        ?.async('blob')) as FileEsque | null;

      if (!file) {
        throw new Error('Asset not found in asset folder!');
      }

      file.name = asset.name;

      data.append('files', file, asset.source);
    }),
  );

  const files = data.getAll('files') as File[];

  return files;
};

export const fetchFileAsBuffer = async (url: string) => {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  return buffer;
};

type ReadAs = 'arrayBuffer' | 'binaryString' | 'dataURL' | 'text';

export function readFileHelper(
  file: Blob | File,
  readAs: ReadAs = 'arrayBuffer',
): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', (err) => {
      reader.abort();
      reject(err);
    });

    reader.addEventListener('load', () => {
      resolve(reader.result);
    });

    if (readAs === 'arrayBuffer') {
      reader.readAsArrayBuffer(file);
    } else if (readAs === 'binaryString') {
      reader.readAsBinaryString(file);
    } else if (readAs === 'dataURL') {
      reader.readAsDataURL(file);
    } else if (readAs === 'text') {
      reader.readAsText(file, 'utf-8');
    }
  });
}
