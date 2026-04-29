import { Readable } from 'node:stream';
import type { Codebook } from '@codaco/protocol-validation';
import type { ExportOptions } from '~/lib/network-exporters/options';
import type { ExportFileNetwork } from '~/lib/network-exporters/session/exportFile';
import GraphMLFormatter from './GraphMLFormatter';

export function graphmlReadable(
  network: ExportFileNetwork,
  codebook: Codebook,
  exportOptions: ExportOptions,
): Readable {
  const formatter = new GraphMLFormatter(network, codebook, exportOptions);
  const xml = formatter.writeToString();
  return Readable.from([xml]);
}
