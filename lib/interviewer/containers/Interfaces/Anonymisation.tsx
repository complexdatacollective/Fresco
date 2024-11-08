import { type NcNode } from '@codaco/shared-consts';
import { useState } from 'react';
// import Node from '~/lib/interviewer/components/Node';
import Switch from '~/lib/interviewer/components/Switch';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    passphrase?: string;
  }
}

// If the passphrase is in local storage, return it. Otherwise use a prompt
// to ask the user to set it, and store it.
export function getPassphrase(): string | undefined {
  return window.passphrase;
}

export type SecureAttributes = Record<string, { salt: number[]; iv: number[] }>;

export type NodeWithSecureAttributes = NcNode & {
  [entitySecureAttributesMeta]?: SecureAttributes;
};

/**
 * Creates a key from a passphrase and a random salt. The salt is used to
 * ensure the same passphrase results in a unique key each time.
 *
 * To derive a key from a passphrase, use the PBKDF2 algorithm to make the
 * encryption more secure by adding a random salt. This ensures the same
 * passphrase results in a unique key each time.
 */
export async function generateKey(passphrase: string, salt: Uint8Array) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptData(data: string, passphrase: string) {
  const encoder = new TextEncoder();

  // Create a new salt and IV for each encryption
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await generateKey(passphrase, salt);
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(data),
  );

  return {
    [entitySecureAttributesMeta]: {
      salt: Array.from(salt),
      iv: Array.from(iv),
    },
    data: Array.from(new Uint8Array(encryptedData)),
  };
}

type EncryptedData = Awaited<ReturnType<typeof encryptData>>;

export async function decryptData(
  encrypted: EncryptedData,
  passphrase: string,
) {
  const {
    data,
    _secureAttributes: { iv, salt },
  } = encrypted;

  const key = await generateKey(passphrase, new Uint8Array(salt));

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    new Uint8Array(data),
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

// Secure cookie name must include protocol name for uniqueness
export const SECURE_COOKIE_NAME = 'fresco-interview-encrypted';
export const entitySecureAttributesMeta = '_secureAttributes';

// Can only be string or number variables.
// TODO: move to protocol?
export const SENSITIVE_ATTRIBUTES = ['name'];

export default function AnonymisationInterface() {
  const [isEncrypted, setIsEncrypted] = useState(!!window.passphrase);

  const toggleEncryption = () => {
    if (isEncrypted) {
      console.log('Disabling encryption');
      window.passphrase = undefined;
      setIsEncrypted(false);
    } else {
      console.log('Enabling encryption');
      // TODO: passphrase must be 'strong'!
      const passphrase = prompt('Enter the encryption key');
      if (!passphrase) {
        return;
      }

      window.passphrase = passphrase;

      setIsEncrypted(true);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <h1>Anonymisation Interface</h1>
        <Switch
          label="Toggle encryption"
          on={isEncrypted}
          className="mt-4"
          onChange={toggleEncryption}
        />
      </div>
    </div>
  );
}
