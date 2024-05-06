import { protocolProperty } from '@codaco/shared-consts';
import { groupBy } from 'lodash';
import { type insertEgoIntoSessionNetworks } from './insertEgoIntoSessionnetworks';

export default function groupByProtocolProperty(
  s: ReturnType<typeof insertEgoIntoSessionNetworks>,
) {
  return groupBy(s, `sessionVariables.${protocolProperty}`);
}
