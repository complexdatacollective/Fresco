import aaguidNames from '~/lib/webauthn/aaguid-names.json';

const registry = aaguidNames as Record<string, string>;

export function getAuthenticatorName(
  aaguid: string,
  deviceType: string,
): string {
  const name = registry[aaguid];
  if (name) return name;
  return deviceType === 'multiDevice' ? 'Synced passkey' : 'Security key';
}
