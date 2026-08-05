import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParticipantExportRow } from '~/actions/participants';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';

import { useExportParticipants } from '../ExportParticipants';

const unparse = vi.hoisted(() =>
  vi.fn((_rows: Record<string, string>[]) => 'csv'),
);
const download = vi.hoisted(() => vi.fn());
const addToast = vi.hoisted(() => vi.fn());

vi.mock('papaparse', () => ({ unparse }));
vi.mock('~/hooks/useDownload', () => ({ useDownload: () => download }));
vi.mock('@codaco/fresco-ui/Toast', () => ({
  useToast: () => ({ add: addToast }),
}));

const protocol: ProtocolWithInterviews = {
  id: 'protocol-1',
  hash: 'hash',
  name: 'My Protocol.netcanvas',
  schemaVersion: 8,
  description: null,
  importedAt: new Date(0),
  lastModified: new Date(0),
  stages: [],
  codebook: {},
  experiments: undefined,
  originalFileKey: null,
  originalFileUrl: null,
  interviews: [],
};

const participant: ParticipantExportRow = {
  id: 'participant-id-1',
  identifier: 'p 1/&',
  label: 'Participant One',
};

describe('useExportParticipants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom does not implement object URLs
    URL.createObjectURL = vi.fn(() => 'blob:url');
    URL.revokeObjectURL = vi.fn();
  });

  it('builds interview URLs the onboard route understands', () => {
    const { result } = renderHook(() => useExportParticipants([protocol]));

    result.current([participant]);

    expect(unparse).toHaveBeenCalledTimes(1);
    const rows = unparse.mock.calls[0]?.[0];
    expect(rows).toBeDefined();
    if (!rows) return;

    // The onboard route reads `participantIdentifier`, not the participant's
    // database id, and the identifier must be URL encoded.
    expect(rows[0]?.['interview_url_My Protocol']).toBe(
      'http://localhost:3000/onboard/protocol-1/?participantIdentifier=p%201%2F%26',
    );
  });
});
