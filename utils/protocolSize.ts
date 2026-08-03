import { MAX_PROTOCOL_UPLOAD_BYTES } from '~/fresco.config';

// Round up so a file that is only slightly over the limit is never displayed
// as exactly the limit (which would read as contradicting the message).
function formatMegabytes(bytes: number): number {
  return Math.ceil(bytes / (1024 * 1024));
}

/**
 * Returns a human-readable error if the protocol file exceeds the upload
 * limit, or null if it is acceptable. The limit is inclusive (a file exactly
 * at the limit is allowed), which the message wording reflects.
 */
export function getProtocolSizeError(file: { size: number }): string | null {
  if (file.size <= MAX_PROTOCOL_UPLOAD_BYTES) {
    return null;
  }

  return `This protocol is ${formatMegabytes(file.size)} MB. Protocols must be ${formatMegabytes(MAX_PROTOCOL_UPLOAD_BYTES)} MB or smaller to import.`;
}
