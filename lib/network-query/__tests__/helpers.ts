import { type FilterRule } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';

export const getEntityGenerator = () => {
  const counts = {
    node: 0,
    edge: 0,
  };

  return (
    attributes = {},
    modelData = {},
    entity: 'node' | 'edge' = 'node',
    type = 'person',
  ) => {
    const entityId = counts[entity] + 1;
    counts[entity] = entityId;

    return {
      [entityPrimaryKeyProperty]: entityId,
      type,
      [entityAttributesProperty]: attributes,
      ...modelData,
    };
  };
};

export const generateRuleConfig = (
  type: FilterRule['type'],
  options: FilterRule['options'],
) => ({
  type,
  options,
});
