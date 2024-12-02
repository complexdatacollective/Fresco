import { execSync } from 'child_process';
import { createDecipheriv } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import type Zip from 'jszip';
import JSZip from 'jszip';
import { join } from 'path';
import { describe, it } from 'vitest';
import { validateProtocol } from '../index';

// Utility functions for encryption handling
const decryptFile = async (
  encryptedBuffer: Buffer,
  key: string,
  iv: string,
): Promise<Buffer> => {
  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex'),
  );
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);
  return decrypted;
};

const downloadAndDecryptProtocols = async (tempDir: string): Promise<void> => {
  const encryptionKey = process.env.PROTOCOL_ENCRYPTION_KEY;
  const encryptionIv = process.env.PROTOCOL_ENCRYPTION_IV;

  if (!encryptionKey || !encryptionIv) {
    throw new Error(
      'Encryption key and IV must be set in environment variables',
    );
  }

  // Download encrypted protocols from GitHub LFS
  // Replace with your actual GitHub repository URL
  const githubUrl =
    'https://github.com/YOUR_ORG/YOUR_REPO/raw/main/test-protocols.tar.gz.enc';

  try {
    console.log('Downloading encrypted protocols...');
    execSync(
      `curl -L -o ${join(tempDir, 'protocols.tar.gz.enc')} ${githubUrl}`,
    );

    // Decrypt the file
    console.log('Decrypting protocols...');
    const encryptedData = await readFile(join(tempDir, 'protocols.tar.gz.enc'));
    const decryptedData = await decryptFile(
      encryptedData,
      encryptionKey,
      encryptionIv,
    );
    await writeFile(join(tempDir, 'protocols.tar.gz'), decryptedData);

    // Extract the tar.gz file
    console.log('Extracting protocols...');
    execSync(`tar -xzf ${join(tempDir, 'protocols.tar.gz')} -C ${tempDir}`);
  } catch (error) {
    console.error('Error preparing protocols:', error);
    throw error;
  }
};

export const getProtocolJsonAsObject = async (zip: Zip) => {
  const protocolString = await zip.file('protocol.json')?.async('string');

  if (!protocolString) {
    throw new Error('protocol.json not found in zip');
  }

  const protocol = await JSON.parse(protocolString);
  return protocol;
};

const extractAndValidate = async (protocolPath: string) => {
  const buffer = await readFile(protocolPath);
  const zip = await JSZip.loadAsync(buffer);
  const protocol = await getProtocolJsonAsObject(zip);

  let schemaVersion = undefined;
  if (!protocol.schemaVersion || protocol.schemaVersion === '1.0.0') {
    console.log('schemaVersion is missing or "1.0.0" for', protocolPath);
    schemaVersion = 1;
  }

  return await validateProtocol(protocol, schemaVersion);
};

// Create temporary directory for test protocols
let tempDir: string;

describe('Test protocols', () => {
  it.todo('should validate all test protocols');

  // beforeAll(async () => {
  //   // Create temporary directory
  //   tempDir = mkdtempSync(join(tmpdir(), 'test-protocols-'));

  //   // Skip download in CI if protocols are already present
  //   if (process.env.CI && process.env.SKIP_PROTOCOL_DOWNLOAD) {
  //     console.log('Skipping protocol download in CI');
  //     return;
  //   }

  //   await downloadAndDecryptProtocols(tempDir);
  // });

  // afterAll(() => {
  //   // Clean up temporary directory
  //   rmSync(tempDir, { recursive: true, force: true });
  // });

  // it.each(readdirSync(tempDir).filter((file) => file.endsWith('.netcanvas')))(
  //   '%s',
  //   async (protocol) => {
  //     const protocolPath = join(tempDir, protocol);
  //     const result = await extractAndValidate(protocolPath);

  //     expect(result.isValid).toBe(true);
  //     expect(result.schemaErrors).toEqual([]);
  //     expect(result.logicErrors).toEqual([]);
  //   },
  // );
});
