import {
  type EntityAttributesProperty,
  type EntitySecureAttributesMeta,
  entitySecureAttributesMeta,
  type NcNode,
} from '~/lib/shared-consts';

export const SESSION_STORAGE_KEY = 'passphrase';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

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

export type EncryptedData = Awaited<ReturnType<typeof encryptData>>;

export async function decryptData(
  encrypted: EncryptedData,
  passphrase: string,
): Promise<string> {
  const {
    data,
    [entitySecureAttributesMeta]: { iv, salt },
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

  // TODO: We need to look up the variable type and re-cast it here.

  return decoder.decode(decryptedData);
}

export async function generateSecureAttributes(
  attributes: NcNode[EntityAttributesProperty],
  passphrase: string,
): Promise<{
  secureAttributes: NcNode[EntitySecureAttributesMeta];
  encryptedAttributes: NcNode[EntityAttributesProperty];
}> {
  const secureAttributes: NcNode[EntitySecureAttributesMeta] = {};
  const encryptedAttributes: NcNode[EntityAttributesProperty] = {};

  for (const [key, value] of Object.entries(attributes)) {
    // TODO: expand this for other variable types
    if (typeof value === 'string') {
      const encoder = new TextEncoder();
      // Create a new salt and IV for each encryption
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encryptionKey = await generateKey(passphrase, salt);
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        encryptionKey,
        encoder.encode(value),
      );

      secureAttributes[key] = {
        iv,
        salt,
      };

      encryptedAttributes[key] = Array.from(new Uint8Array(encryptedData));
    }
  }

  return {
    secureAttributes,
    encryptedAttributes,
  };
}
