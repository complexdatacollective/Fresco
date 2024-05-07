import { protocolProperty } from '@codaco/shared-consts';
import groupBy from 'lodash/groupBy';
import type { SessionWithNetworkEgo } from './insertEgoIntoSessionnetworks';

export default function groupByProtocolProperty(
  s: SessionWithNetworkEgo[],
): SessionsByProtocol {
  return groupBy(s, `sessionVariables.${protocolProperty}`);
}

export type SessionsByProtocol = Record<string, SessionWithNetworkEgo[]>;
