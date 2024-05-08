import { protocolProperty } from '@codaco/shared-consts';
import groupBy from 'lodash/groupBy';
import type { SessionWithNetworkEgo } from '../../utils/types';

export default function groupByProtocolProperty(
  s: SessionWithNetworkEgo[],
): SessionsByProtocol {
  return groupBy(s, `sessionVariables.${protocolProperty}`);
}
