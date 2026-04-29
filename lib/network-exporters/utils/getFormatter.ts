import type { Readable } from 'node:stream';
import type { Codebook } from '@codaco/protocol-validation';
import { adjacencyMatrixReadable } from '../formatters/csv/adjacencyMatrix';
import { attributeListReadable } from '../formatters/csv/attributeList';
import { edgeListReadable } from '../formatters/csv/edgeList';
import { egoListReadable } from '../formatters/csv/egoList';
import { graphmlReadable } from '../formatters/graphml/graphmlReadable';
import type { ExportFileNetwork } from '../session/exportFile';
import type { ExportFormat, ExportOptions } from '../options';

type FormatterReadable = (
  network: ExportFileNetwork,
  codebook: Codebook,
  options: ExportOptions,
) => Readable;

export function getFormatter(format: ExportFormat): FormatterReadable {
  switch (format) {
    case 'graphml':
      return graphmlReadable;
    case 'attributeList':
      return attributeListReadable;
    case 'edgeList':
      return edgeListReadable;
    case 'ego':
      return egoListReadable;
    case 'adjacencyMatrix':
      return adjacencyMatrixReadable;
  }
}
