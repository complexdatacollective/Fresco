import { type StageSubject } from '@codaco/protocol-validation';
import { entityAttributesProperty, type NcNetwork } from '@codaco/shared-consts';

export default function collectNetworkValues(
  network: NcNetwork,
  subject: Extract<StageSubject, { entity: 'node' | 'edge' }>,
  attribute: string,
) {
  if (subject.entity === 'node') {
    return network.nodes.map((n) => n[entityAttributesProperty][attribute]);
  }

  return network.edges.map((e) => e[entityAttributesProperty][attribute]);
}
