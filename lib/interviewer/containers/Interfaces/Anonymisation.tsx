import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useState } from 'react';
// import Node from '~/lib/interviewer/components/Node';
import Switch from '~/lib/interviewer/components/Switch';
import { Node } from '~/lib/ui/components';

export type NodeWithSecureAttributes = NcNode & {
  [entitySecureAttributesMeta]?: Record<
    string,
    { salt: number[]; iv: number[] }
  >;
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
    salt: Array.from(salt),
    iv: Array.from(iv),
    encryptedData: Array.from(new Uint8Array(encryptedData)),
  };
}

type EncryptedData = Awaited<ReturnType<typeof encryptData>>;

export async function decryptData(
  encrypted: EncryptedData,
  passphrase: string,
) {
  const { salt, iv, encryptedData } = encrypted;

  const key = await generateKey(passphrase, new Uint8Array(salt));

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    new Uint8Array(encryptedData),
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

const NodeData: NodeWithSecureAttributes[] = [
  {
    [entityPrimaryKeyProperty]: '1',
    type: 'person',
    [entityAttributesProperty]: {
      name: 'Steve',
      other: 123,
    },
    // [entitySecureAttributesMeta]: {
    //   name: {
    //     salt: [1, 2, 3],
    //     iv: [4, 5, 6],
    //   }
    // }
  },
  {
    [entityPrimaryKeyProperty]: '2',
    type: 'person',
    [entityAttributesProperty]: {
      name: 'Alice',
      other: 456,
    },
  },
  {
    [entityPrimaryKeyProperty]: '3',
    type: 'person',
    [entityAttributesProperty]: {
      name: 'Bob',
      other: 789,
    },
  },
];

export default function AnonymisationInterface() {
  const [passphrase, setPassphrase] = useState<string | undefined>(undefined);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [data, setData] = useState<NodeWithSecureAttributes[]>(NodeData);

  const toggleEncryption = async () => {
    if (isEncrypted) {
      if (!passphrase) {
        const newPassphrase = prompt('Please re-enter your passphrase');
        if (!newPassphrase) {
          return;
        }

        setPassphrase(newPassphrase);
      }
      // already encrypted - decrypt
      const newData = await Promise.all(
        data.map(async (node: NodeWithSecureAttributes) => {
          // Iterate the sensitive attributes to see if the node has them
          for (const attr of SENSITIVE_ATTRIBUTES) {
            if (node[entityAttributesProperty][attr]) {
              const encryptedAttribute = node[entityAttributesProperty][
                attr
              ] as number[];
              const meta = node[entitySecureAttributesMeta]![attr]!;

              const decrypted = await decryptData(
                {
                  encryptedData: encryptedAttribute,
                  ...meta,
                },
                passphrase!,
              );

              // replace the sensitive attribute with the decrypted data
              node[entityAttributesProperty][attr] = decrypted;

              // delete the salt and iv from the meta object
              delete node[entitySecureAttributesMeta]![attr];
            }
          }

          return node;
        }),
      );

      setData(newData);
      setIsEncrypted(false);
    } else {
      // TODO: passphrase must be 'strong'!
      const passphrase = prompt('Enter the encryption key');
      if (!passphrase) {
        return;
      }

      setPassphrase(passphrase);

      const newData = await Promise.all(
        data.map(async (node) => {
          // Iterate the sensitive attributes to see if the node has them
          for (const attr of SENSITIVE_ATTRIBUTES) {
            if (node[entityAttributesProperty][attr]) {
              // If the node has sensitive attributes, encrypt them
              const { salt, iv, encryptedData } = await encryptData(
                node[entityAttributesProperty][attr] as string,
                passphrase,
              );

              // replace the sensitive attribute with the encrypted data
              node[entityAttributesProperty][attr] = encryptedData;

              // store the salt and iv in the meta object
              node[entitySecureAttributesMeta] = {
                ...node[entitySecureAttributesMeta],
                [attr]: {
                  salt,
                  iv,
                },
              };
            }
          }

          return node;
        }),
      );

      setData(newData);
      setIsEncrypted(true);
    }
  };

  console.log(data);

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
      <div>
        {data.map((node) => (
          <Node
            label={node[entityAttributesProperty].name}
            key={node[entityPrimaryKeyProperty]}
          />
        ))}
      </div>
    </div>
  );
}
