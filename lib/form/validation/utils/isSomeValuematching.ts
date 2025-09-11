import {
  entityAttributesProperty,
  NcEdge,
  NcEgo,
  NcNode,
} from '@codaco/shared-consts';
import { some } from 'es-toolkit/compat';
import { FieldValue } from '../../types';
import isMatchingValue from './isMatchingValue';

export default function isSomeValueMatching(
  value: FieldValue,
  otherNetworkEntities: NcNode[] | NcEdge[] | NcEgo[],
  name: string,
) {
  return some(
    otherNetworkEntities,
    (entity) =>
      entity[entityAttributesProperty] &&
      isMatchingValue(value, entity[entityAttributesProperty][name]),
  );
}
