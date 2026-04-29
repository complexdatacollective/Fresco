import {
  entityAttributesProperty,
  type NcEntity,
} from '@codaco/shared-consts';

export const getEntityAttributes = (entity: NcEntity) =>
  entity?.[entityAttributesProperty] || {};
