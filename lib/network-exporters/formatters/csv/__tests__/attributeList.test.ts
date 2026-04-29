import {
  egoProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  ncUUIDProperty,
  nodeExportIDProperty,
} from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import { attributeListRows } from '../attributeList';
import { mockCodebook, mockExportOptions } from './mockObjects';

const makeNetwork = (
  nodes: SessionWithResequencedIDs['nodes'],
): SessionWithResequencedIDs =>
  ({
    nodes,
    edges: [],
  }) as unknown as SessionWithResequencedIDs;

describe('attributeListRows', () => {
  it('yields header followed by one row per node', () => {
    const network = makeNetwork([
      {
        [nodeExportIDProperty]: 1,
        [egoProperty]: 'ego-1',
        [entityPrimaryKeyProperty]: 'uid-1',
        type: 'mock-node-type',
        [entityAttributesProperty]: { 'mock-uuid-1': 'Jane' },
      } as SessionWithResequencedIDs['nodes'][number],
    ]);

    const rows = Array.from(
      attributeListRows(network, mockCodebook, mockExportOptions),
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain(nodeExportIDProperty);
    expect(rows[0]).toContain(egoProperty);
    expect(rows[0]).toContain(ncUUIDProperty);
    expect(rows[0]).toContain('firstName');
    expect(rows[1]).toContain('Jane');
  });

  it('yields only the header for an empty network', () => {
    const network = makeNetwork([]);
    const rows = Array.from(
      attributeListRows(network, mockCodebook, mockExportOptions),
    );
    expect(rows).toHaveLength(1);
  });
});
