import type { Codebook } from '@codaco/protocol-validation';
import {
  edgeExportIDProperty,
  egoProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  ncSourceUUID,
  ncTargetUUID,
  ncUUIDProperty,
} from '@codaco/shared-consts';
import type { Readable } from 'node:stream';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import type { ExportOptions } from '~/lib/network-exporters/options';
import { csvEOL, sanitizeCellValue, toReadable } from './csvShared';
import processEntityVariables from './processEntityVariables';

const TOP_LEVEL_KEYS = new Set<string>([
  entityPrimaryKeyProperty,
  edgeExportIDProperty,
  egoProperty,
  'to',
  'from',
  ncSourceUUID,
  ncTargetUUID,
]);

const printableAttribute = (attribute: string) =>
  attribute === entityPrimaryKeyProperty ? ncUUIDProperty : attribute;

type ProcessedEdge = ReturnType<typeof processEntityVariables>;

function collectHeaders(edges: ProcessedEdge[]): string[] {
  const headers = new Set<string>([
    edgeExportIDProperty,
    'from',
    'to',
    egoProperty,
    entityPrimaryKeyProperty,
    ncSourceUUID,
    ncTargetUUID,
  ]);
  for (const edge of edges) {
    for (const key of Object.keys(edge[entityAttributesProperty] ?? {})) {
      headers.add(key);
    }
  }
  return [...headers];
}

export function* edgeListRows(
  network: SessionWithResequencedIDs,
  codebook: Codebook,
  exportOptions: ExportOptions,
): Generator<string, void, void> {
  const edges: ProcessedEdge[] = (network.edges ?? []).map((edge) =>
    processEntityVariables(edge, 'edge', codebook, exportOptions),
  );

  const headers = collectHeaders(edges);

  yield headers
    .map((h) => String(sanitizeCellValue(printableAttribute(h)) ?? ''))
    .join(',') + csvEOL;

  for (const edge of edges) {
    const cells = headers.map((header) => {
      const value = TOP_LEVEL_KEYS.has(header)
        ? (edge as Record<string, unknown>)[header]
        : (
            edge[entityAttributesProperty] as
              | Record<string, unknown>
              | undefined
          )?.[header];
      return String(sanitizeCellValue(value) ?? '');
    });
    yield cells.join(',') + csvEOL;
  }
}

export function edgeListReadable(
  network: SessionWithResequencedIDs,
  codebook: Codebook,
  exportOptions: ExportOptions,
): Readable {
  return toReadable(edgeListRows(network, codebook, exportOptions));
}
