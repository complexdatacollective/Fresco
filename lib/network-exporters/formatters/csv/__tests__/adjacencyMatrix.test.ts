import { ncSourceUUID, ncTargetUUID } from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import { adjacencyMatrixRows } from '../adjacencyMatrix';
import { mockCodebook, mockExportOptions } from './mockObjects';

const mockNetwork = (edges: Record<string, unknown>[]) => ({
  edges,
  nodes: Object.values(
    edges.reduce<Record<string, { _uid: string }>>((acc, val) => {
      acc[val[ncSourceUUID] as string] = { _uid: val[ncSourceUUID] as string };
      acc[val[ncTargetUUID] as string] = { _uid: val[ncTargetUUID] as string };
      return acc;
    }, {}),
  ),
});

describe('adjacencyMatrixRows', () => {
  it('renders a simple undirected matrix as CSV rows', () => {
    const rows = Array.from(
      adjacencyMatrixRows(
        mockNetwork([
          { [ncSourceUUID]: '1', [ncTargetUUID]: '2' },
        ]) as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    expect(rows.join('')).toBe(',1,2\r\n1,0,1\r\n2,1,0\r\n');
  });

  it('handles duplicate edges (presence not counts)', () => {
    const rows = Array.from(
      adjacencyMatrixRows(
        mockNetwork([
          { [ncSourceUUID]: '1', [ncTargetUUID]: '2' },
          { [ncSourceUUID]: '1', [ncTargetUUID]: '2' },
        ]) as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    expect(rows.join('')).toBe(',1,2\r\n1,0,1\r\n2,1,0\r\n');
  });

  it('renders a matrix with > 8 cells correctly', () => {
    const rows = Array.from(
      adjacencyMatrixRows(
        mockNetwork([
          { [ncSourceUUID]: '1', [ncTargetUUID]: '2' },
          { [ncSourceUUID]: '3', [ncTargetUUID]: '4' },
          { [ncSourceUUID]: '5', [ncTargetUUID]: '6' },
          { [ncSourceUUID]: '7', [ncTargetUUID]: '8' },
          { [ncSourceUUID]: '9', [ncTargetUUID]: '10' },
        ]) as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    const expected = [
      ',1,2,3,4,5,6,7,8,9,10',
      '1,0,1,0,0,0,0,0,0,0,0',
      '2,1,0,0,0,0,0,0,0,0,0',
      '3,0,0,0,1,0,0,0,0,0,0',
      '4,0,0,1,0,0,0,0,0,0,0',
      '5,0,0,0,0,0,1,0,0,0,0',
      '6,0,0,0,0,1,0,0,0,0,0',
      '7,0,0,0,0,0,0,0,1,0,0',
      '8,0,0,0,0,0,0,1,0,0,0',
      '9,0,0,0,0,0,0,0,0,0,1',
      '10,0,0,0,0,0,0,0,0,1,0\r\n',
    ].join('\r\n');
    expect(rows.join('')).toBe(expected);
  });

  it('renders an empty network as an empty header row', () => {
    const rows = Array.from(
      adjacencyMatrixRows(
        { nodes: [], edges: [] } as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    expect(rows.join('')).toBe(',\r\n');
  });
});
