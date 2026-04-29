import {
  edgeExportIDProperty,
  egoProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  ncSourceUUID,
  ncTargetUUID,
  ncUUIDProperty,
} from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import { edgeListRows } from '../edgeList';
import { mockCodebook, mockExportOptions } from './mockObjects';

describe('edgeListRows', () => {
  it('yields header followed by one row per edge', () => {
    const network = {
      nodes: [],
      edges: [
        {
          [edgeExportIDProperty]: 1,
          [egoProperty]: 'ego-1',
          [entityPrimaryKeyProperty]: 'edge-1',
          [ncSourceUUID]: 'n1',
          [ncTargetUUID]: 'n2',
          from: 1,
          to: 2,
          type: 'mock-edge-type',
          [entityAttributesProperty]: { 'relationship-uuid': 'partner' },
        },
      ],
    };

    const rows = Array.from(
      edgeListRows(
        network as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain(ncUUIDProperty);
    expect(rows[0]).toContain('from');
    expect(rows[0]).toContain('to');
    // processEntityVariables expands categorical attributes into boolean columns
    // e.g. 'relationship-uuid': 'partner' → RelationshipType_partner column = true
    expect(rows[0]).toContain('RelationshipType_partner');
    expect(rows[1]).toContain('true');
  });

  it('yields only the header for an empty edge set', () => {
    const network = { nodes: [], edges: [] };
    const rows = Array.from(
      edgeListRows(
        network as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    expect(rows).toHaveLength(1);
  });
});
