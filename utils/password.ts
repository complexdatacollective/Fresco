import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Lucia v2 scrypt password hashing compatibility.
 *
 * Lucia v2 stores hashes in the format "s2:<salt>:<hex-encoded-key>" using
 * scrypt with N=16384, r=16, p=1, dkLen=64 and a 16-char alphanumeric salt.
 * We replicate those parameters here using Node.js built-in crypto.scrypt
 * so that existing password hashes remain verifiable.
 */

const SCRYPT_N = 16384;
const SCRYPT_R = 16;
const SCRYPT_P = 1;
const SCRYPT_DKLEN = 64;
const SALT_ALPHABET = 'abcdefghijklmnopqrstuvwxyz1234567890';
const SALT_LENGTH = 16;

function generateSalt(): string {
  let result = '';
  const alphabetLength = SALT_ALPHABET.length;
  const maxByte = 256 - (256 % alphabetLength);

  while (result.length < SALT_LENGTH) {
    const bytes = randomBytes(SALT_LENGTH);
    for (let i = 0; i < bytes.length && result.length < SALT_LENGTH; i++) {
      const byte = bytes[i]!;
      if (byte >= maxByte) continue;
      const index = byte % alphabetLength;
      result += SALT_ALPHABET[index]!;
    }
  }

  return result;
}

function scryptAsync(
  password: Buffer,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function toHex(buffer: Buffer): string {
  return buffer.toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const normalized = password.normalize('NFKC');
  const key = await scryptAsync(
    Buffer.from(normalized),
    Buffer.from(salt),
    SCRYPT_DKLEN,
    {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: 128 * SCRYPT_N * SCRYPT_R * 2,
    },
  );
  return `s2:${salt}:${toHex(key)}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const parts = hash.split(':');
  const normalized = password.normalize('NFKC');

  if (parts.length === 3 && parts[0] === 's2') {
    const salt = parts[1]!;
    const storedKey = parts[2]!;
    const key = await scryptAsync(
      Buffer.from(normalized),
      Buffer.from(salt),
      SCRYPT_DKLEN,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: 128 * SCRYPT_N * SCRYPT_R * 2,
      },
    );
    const derivedHex = toHex(key);
    if (derivedHex.length !== storedKey.length) return false;
    return timingSafeEqual(Buffer.from(derivedHex), Buffer.from(storedKey));
  }

  // Legacy format (pre-s2): "salt:key" with r=8
  if (parts.length === 2) {
    const salt = parts[0]!;
    const storedKey = parts[1]!;
    const key = await scryptAsync(
      Buffer.from(normalized),
      Buffer.from(salt),
      SCRYPT_DKLEN,
      { N: SCRYPT_N, r: 8, p: SCRYPT_P, maxmem: 128 * SCRYPT_N * 8 * 2 },
    );
    const derivedHex = toHex(key);
    if (derivedHex.length !== storedKey.length) return false;
    return timingSafeEqual(Buffer.from(derivedHex), Buffer.from(storedKey));
  }

  return false;
}
