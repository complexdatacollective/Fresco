import type { Codebook } from '@codaco/protocol-validation';
import {
  entityPrimaryKeyProperty,
  ncSourceUUID,
  ncTargetUUID,
} from '@codaco/shared-consts';
import type { Readable } from 'node:stream';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import type { ExportOptions } from '~/lib/network-exporters/options';
import { csvEOL, toReadable } from './csvShared';

class AdjacencyMatrix {
  readonly uniqueNodeIds: string[];
  readonly dimension: number;
  readonly arrayView: Uint8Array;
  private indexMap: Record<string, number> = {};

  constructor(network: SessionWithResequencedIDs) {
    const ids = (network.nodes ?? []).map(
      (n) => (n as Record<string, unknown>)[entityPrimaryKeyProperty] as string,
    );
    this.uniqueNodeIds = [...new Set(ids)];
    this.dimension = this.uniqueNodeIds.length;
    const bitLength = Math.ceil((this.dimension * this.dimension) / 8);
    this.arrayView = new Uint8Array(new ArrayBuffer(bitLength));
  }

  private setAdjacent(from: string, to: string) {
    const fromIndex = this.indexMap[from];
    const toIndex = this.indexMap[to];
    if (fromIndex === undefined || toIndex === undefined) return;
    const elementIndex = this.dimension * fromIndex + toIndex;
    const byteIndex = elementIndex >> 3;
    const bitIndex = elementIndex & 7;
    const current = this.arrayView[byteIndex] ?? 0;
    this.arrayView[byteIndex] = current | (1 << (7 - bitIndex));
  }

  calculateEdges(edges: readonly Record<string, unknown>[]) {
    this.indexMap = {};
    this.uniqueNodeIds.forEach((id, i) => {
      this.indexMap[id] = i;
    });
    edges.forEach((edge) => {
      const source = edge[ncSourceUUID] as string;
      const target = edge[ncTargetUUID] as string;
      this.setAdjacent(source, target);
      this.setAdjacent(target, source);
    });
  }

  *rows(): Generator<string, void, void> {
    const dataColumnCount = this.dimension;
    yield `,${this.uniqueNodeIds.join(',')}${csvEOL}`;
    let matrixIndex = 0;
    for (let row = 0; row < dataColumnCount; row += 1) {
      const cols: number[] = [];
      for (let col = 0; col < dataColumnCount; col += 1) {
        const byteIndex = matrixIndex >> 3;
        const bitIndex = matrixIndex & 7;
        const bitmask = 1 << (7 - bitIndex);
        cols.push(((this.arrayView[byteIndex] ?? 0) & bitmask) !== 0 ? 1 : 0);
        matrixIndex += 1;
      }
      yield `${this.uniqueNodeIds[row]},${cols.join(',')}${csvEOL}`;
    }
  }
}

export function* adjacencyMatrixRows(
  network: SessionWithResequencedIDs,
  _codebook: Codebook,
  _options: ExportOptions,
): Generator<string, void, void> {
  const matrix = new AdjacencyMatrix(network);
  matrix.calculateEdges(
    (network.edges ?? []) as readonly Record<string, unknown>[],
  );
  yield* matrix.rows();
}

export function adjacencyMatrixReadable(
  network: SessionWithResequencedIDs,
  codebook: Codebook,
  options: ExportOptions,
): Readable {
  return toReadable(adjacencyMatrixRows(network, codebook, options));
}
