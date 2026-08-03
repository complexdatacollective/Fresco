import { headers } from 'next/headers';
import 'server-only';

export async function getClientIp(): Promise<string | null> {
  const headerStore = await headers();

  const cfConnectingIp = headerStore.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const xRealIp = headerStore.get('x-real-ip');
  if (xRealIp) return xRealIp;

  const xForwardedFor = headerStore.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  return null;
}
