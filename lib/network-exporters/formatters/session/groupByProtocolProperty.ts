import { groupBy } from 'es-toolkit';
import { protocolProperty } from '~/lib/shared-consts';
import type {
  SessionWithNetworkEgo,
  SessionsByProtocol,
} from '../../utils/types';

export default function groupByProtocolProperty(
  s: SessionWithNetworkEgo[],
): SessionsByProtocol {
  return groupBy(s, (i) => i.sessionVariables[protocolProperty]);
}
