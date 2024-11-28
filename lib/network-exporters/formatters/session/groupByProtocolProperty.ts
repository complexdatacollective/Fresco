import { protocolProperty } from '@codaco/shared-consts';
import { groupBy } from 'es-toolkit';
import type {
  SessionWithNetworkEgo,
  SessionsByProtocol,
} from '../../utils/types';

export default function groupByProtocolProperty(
  s: SessionWithNetworkEgo[],
): SessionsByProtocol {
  return groupBy(s, (i) => i.sessionVariables[protocolProperty]);
}
