// Reject URLs that target private, loopback, or link-local addresses to limit
// SSRF when a user-supplied value (e.g. the admin-configured S3 endpoint) is
// later requested server-side. Hostnames (e.g. `minio`, `s3.amazonaws.com`)
// are allowed — only literal private/loopback/link-local IPs are rejected — so
// container-internal endpoints addressed by hostname keep working.

function parseIpv4(host: string): number[] | null {
  const parts = host.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
}

function isPrivateIpv4(host: string): boolean {
  const parts = parseIpv4(host);
  if (!parts) return false;
  const [a, b] = parts as [number, number, number, number];
  if (a === 0 || a === 127) return true; // unspecified / loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  if (h === '::1' || h === '::') return true; // loopback / unspecified
  if (h.startsWith('fe80')) return true; // link-local
  if (h.startsWith('fc') || h.startsWith('fd')) return true; // unique-local
  return false;
}

export function isSafeHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname;
  if (!host) return false;
  if (isPrivateIpv4(host)) return false;
  if (host.includes(':') || host.startsWith('[')) {
    if (isPrivateIpv6(host)) return false;
  }
  return true;
}
