import { readdirSync } from 'fs';
import { readFile } from 'fs/promises';
import type Zip from 'jszip';
import JSZip from 'jszip';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { validateProtocol } from '~/lib/protocol-validation';

export const getProtocolJsonAsObject = async (zip: Zip) => {
  const protocolString = await zip.file('protocol.json')?.async('string');

  if (!protocolString) {
    throw new Error('protocol.json not found in zip');
  }

  const protocol = await JSON.parse(protocolString);

  return protocol;
};

const extractAndValidate = async (protocolPath: string) => {
  // Preparing protocol...
  const buffer = await readFile(protocolPath);

  // Unzipping...
  const zip = await JSZip.loadAsync(buffer);

  const protocol = await getProtocolJsonAsObject(zip);

  // Hack because somme test protocols don't specify schema versions correctly
  let schemaVersion = undefined;
  if (!protocol.schemaVersion || protocol.schemaVersion === '1.0.0') {
    console.log('schemaVersion is missing or "1.0.0" for', protocolPath);
    schemaVersion = 1;
  }

  // Validating protocol...
  return await validateProtocol(protocol, schemaVersion);
};

if (process.env.CI) {
  console.log('Running in CI, skipping protocol tests');
  process.exit(0);
}

const PROTOCOL_PATH = '../../test-protocols';
const protocols = readdirSync(join(__dirname, PROTOCOL_PATH)).filter((file) =>
  file.endsWith('.netcanvas'),
);

describe('Test protocols', () => {
  it.each(protocols)('%s', async (protocol) => {
    const protocolPath = join(__dirname, PROTOCOL_PATH, protocol);
    const result = await extractAndValidate(protocolPath);

    expect(result.isValid).toBe(true);
    expect(result.schemaErrors).toEqual([]);
    expect(result.logicErrors).toEqual([]);
  });
});
