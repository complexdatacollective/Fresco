import { describe, expect, it } from 'vitest';

import type { VersionedProtocol } from '@codaco/protocol-validation';

import { validateAndMigrateProtocol } from '../validateAndMigrateProtocol';

const protocolWithRawColor = {
  name: 'Invalid color protocol',
  schemaVersion: 8,
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: '#cc0000',
        shape: { default: 'circle' },
      },
    },
    edge: {},
    ego: {},
  },
  stages: [],
  assetManifest: {},
} as unknown as VersionedProtocol;

describe('validateAndMigrateProtocol', () => {
  it('rejects raw colors in a current-version protocol', async () => {
    const result = await validateAndMigrateProtocol(protocolWithRawColor);

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected raw protocol colors to fail validation');
    }
    expect(result.error).toBe('validation-failed');
  });
});
