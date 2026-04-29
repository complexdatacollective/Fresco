import type { Codebook } from '@codaco/protocol-validation';
import {
  caseProperty,
  egoProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  ncCaseProperty,
  ncProtocolNameProperty,
  ncSessionProperty,
  protocolName,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '@codaco/shared-consts';
import type { Readable } from 'node:stream';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import type { ExportOptions } from '~/lib/network-exporters/options';
import { csvEOL, sanitizeCellValue, toReadable } from './csvShared';
import processEntityVariables from './processEntityVariables';

const TOP_LEVEL_KEYS = new Set<string>([
  entityPrimaryKeyProperty,
  caseProperty,
  sessionProperty,
  protocolName,
  sessionStartTimeProperty,
  sessionFinishTimeProperty,
  sessionExportTimeProperty,
  'APP_VERSION',
  'COMMIT_HASH',
]);

const printableAttribute = (attribute: string) => {
  switch (attribute) {
    case caseProperty:
      return ncCaseProperty;
    case sessionProperty:
      return ncSessionProperty;
    case protocolName:
      return ncProtocolNameProperty;
    case entityPrimaryKeyProperty:
      return egoProperty;
    default:
      return attribute;
  }
};

function collectHeaders(ego: Record<string, unknown>): string[] {
  const headers = new Set<string>([
    entityPrimaryKeyProperty,
    caseProperty,
    sessionProperty,
    protocolName,
    sessionStartTimeProperty,
    sessionFinishTimeProperty,
    sessionExportTimeProperty,
    'APP_VERSION',
    'COMMIT_HASH',
  ]);

  const attrs =
    (ego[entityAttributesProperty] as Record<string, unknown>) ?? {};
  for (const key of Object.keys(attrs)) {
    headers.add(key);
  }

  return [...headers];
}

export function* egoListRows(
  network: SessionWithResequencedIDs,
  codebook: Codebook,
  exportOptions: ExportOptions,
): Generator<string, void, void> {
  const merged = {
    ...(network.ego as Record<string, unknown>),
    ...(network.sessionVariables as Record<string, unknown>),
  };

  const ego = processEntityVariables(
    merged as never,
    'ego',
    codebook,
    exportOptions,
  ) as Record<string, unknown>;

  const headers = collectHeaders(ego);

  yield headers
    .map((h) => String(sanitizeCellValue(printableAttribute(h)) ?? ''))
    .join(',') + csvEOL;

  const cells = headers.map((header) => {
    const value = TOP_LEVEL_KEYS.has(header)
      ? ego[header]
      : (
          ego[entityAttributesProperty] as
            | Record<string, unknown>
            | undefined
        )?.[header];
    return String(sanitizeCellValue(value) ?? '');
  });

  yield cells.join(',') + csvEOL;
}

export function egoListReadable(
  network: SessionWithResequencedIDs,
  codebook: Codebook,
  exportOptions: ExportOptions,
): Readable {
  return toReadable(egoListRows(network, codebook, exportOptions));
}
