import { MAX_PROTOCOL_UPLOAD_BYTES } from '~/fresco.config';

function formatMegabytes(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

/**
 * Returns a human-readable error if the protocol file exceeds the upload
 * limit, or null if it is acceptable.
 */
export function getProtocolSizeError(file: { size: number }): string | null {
  if (file.size <= MAX_PROTOCOL_UPLOAD_BYTES) {
    return null;
  }

  return `This protocol is ${formatMegabytes(file.size)} MB. Protocols must be smaller than ${formatMegabytes(MAX_PROTOCOL_UPLOAD_BYTES)} MB to import.`;
}
