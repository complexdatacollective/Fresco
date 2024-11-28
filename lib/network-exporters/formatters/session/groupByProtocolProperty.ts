import { protocolProperty } from '@codaco/shared-consts';
import { groupBy } from 'lodash-es';
import type {
  SessionWithNetworkEgo,
  SessionsByProtocol,
} from '../../utils/types';

export default function groupByProtocolProperty(
  s: SessionWithNetworkEgo[],
): SessionsByProtocol {
  return groupBy(s, `sessionVariables.${protocolProperty}`);
}
