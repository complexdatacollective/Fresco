import type { Codebook } from '@codaco/protocol-validation';
import {
  egoProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  ncUUIDProperty,
  nodeExportIDProperty,
} from '@codaco/shared-consts';
import type { Readable } from 'node:stream';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import type { ExportOptions } from '~/lib/network-exporters/options';
import { csvEOL, sanitizeCellValue, toReadable } from './csvShared';
import processEntityVariables from './processEntityVariables';

const printableAttribute = (attribute: string) =>
  attribute === entityPrimaryKeyProperty ? ncUUIDProperty : attribute;

type ProcessedNode = ReturnType<typeof processEntityVariables>;

function collectHeaders(nodes: ProcessedNode[]): string[] {
  const headers = new Set<string>([
    nodeExportIDProperty,
    egoProperty,
    entityPrimaryKeyProperty,
  ]);
  for (const node of nodes) {
    for (const key of Object.keys(node[entityAttributesProperty])) {
      headers.add(key);
    }
  }
  return [...headers];
}

export function* attributeListRows(
  network: SessionWithResequencedIDs,
  codebook: Codebook,
  exportOptions: ExportOptions,
): Generator<string, void, void> {
  const nodes: ProcessedNode[] = (network.nodes ?? []).map((node) =>
    codebook.node?.[node.type]
      ? processEntityVariables(node, 'node', codebook, exportOptions)
      : (node as unknown as ProcessedNode),
  );

  const headers = collectHeaders(nodes);

  yield headers
    .map((h) => String(sanitizeCellValue(printableAttribute(h)) ?? ''))
    .join(',') + csvEOL;

  for (const node of nodes) {
    const cells = headers.map((header) => {
      let value: unknown;
      if (
        header === entityPrimaryKeyProperty ||
        header === egoProperty ||
        header === nodeExportIDProperty
      ) {
        value = (node as Record<string, unknown>)[header];
      } else {
        value = (node[entityAttributesProperty] as Record<string, unknown>)[
          header
        ];
      }
      return String(sanitizeCellValue(value) ?? '');
    });
    yield cells.join(',') + csvEOL;
  }
}

export function attributeListReadable(
  network: SessionWithResequencedIDs,
  codebook: Codebook,
  exportOptions: ExportOptions,
): Readable {
  return toReadable(attributeListRows(network, codebook, exportOptions));
}
