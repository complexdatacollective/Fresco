import { type NcNode } from '@codaco/shared-consts';
import { useEffect, useState } from 'react';
import Switch from '~/lib/interviewer/components/Switch';
import getEntityAttributes from '../../utils/getEntityAttributes';
import {
  SESSION_STORAGE_KEY,
  UnauthorizedError,
  useNodeAttributes,
} from '../../utils/labelLogic';
import crypto from 'crypto';

export function useNodeLabel(node: NodeWithSecureAttributes) {
  const [label, setLabel] = useState<string | undefined>(undefined);
  const { getByName } = useNodeAttributes(node);

  useEffect(() => {
    async function calculateLabel() {
      // 1. Look for a variable called 'name'.
      try {
        const variableCalledName = await getByName<string>('name');

        if (variableCalledName) {
          setLabel(variableCalledName);
          return;
        }
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          setLabel('🔒');
          return;
        }
      }

      // 2. Look for a property on the node with a key of ‘name’
      const nodeAttributes = getEntityAttributes(node);

      if (
        Object.keys(nodeAttributes)
          .map((a) => a.toLowerCase())
          .includes('name')
      ) {
        setLabel(nodeAttributes.name as string);
        return;
      }

      // 3. Last resort!
      setLabel("No 'name' variable!");
      return;
    }

    void calculateLabel();
  }, [node, getByName]);

  return label;
}

export const entitySecureAttributesMeta = '_secureAttributes';

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

export default function AnonymisationInterface() {
  const [isEncrypted, setIsEncrypted] = useState(
    () => !!sessionStorage.getItem(SESSION_STORAGE_KEY),
  );

  const encrypt = (text: string, key: string) => {
    const cipher = crypto.createCipher('aes-256-ctr', key);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  };

  const decrypt = (text: string, key: string) => {
    const decipher = crypto.createDecipher('aes-256-ctr', key);
    return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
  };

  const toggleEncryption = () => {
    if (isEncrypted) {
      console.log('Disabling encryption');
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setIsEncrypted(false);
    } else {
      console.log('Enabling encryption');
      // TODO: passphrase must be 'strong'!
      const passphrase = prompt('Enter the encryption key');
      if (!passphrase) {
        return;
      }

      const encryptedPassphrase = encrypt(passphrase, 'encryption_key');
      sessionStorage.setItem(SESSION_STORAGE_KEY, encryptedPassphrase);

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
