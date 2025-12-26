import {
  entityAttributesProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
} from '@codaco/shared-consts';
import { some } from 'es-toolkit/compat';
import { type FieldValue } from '../../types';
import isMatchingValue from './isMatchingValue';

export default function isSomeValueMatching(
  value: FieldValue,
  otherNetworkEntities: NcNode[] | NcEdge[] | NcEgo[],
  name: string,
) {
  return some(otherNetworkEntities, (entity) =>
    isMatchingValue(value, entity[entityAttributesProperty][name]),
  );
}
