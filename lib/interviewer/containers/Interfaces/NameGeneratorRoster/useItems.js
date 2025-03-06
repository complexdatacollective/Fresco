import { useCallback, useMemo } from 'react';
import useExternalData from '~/lib/interviewer/hooks/useExternalData';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import { getCardAdditionalProperties } from '~/lib/interviewer/selectors/name-generator';
import {
  getNetworkNodes,
  getNodeTypeDefinition,
  labelLogic,
} from '~/lib/interviewer/selectors/session';
import getParentKeyByNameValue from '~/lib/interviewer/utils/getParentKeyByNameValue';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '~/lib/shared-consts';
import { getEntityAttributes } from '~/utils/general';

/**
 * Format details needed for list cards
 */
const detailsWithVariableUUIDs = (props) => (node) => {
  const { nodeTypeDefinition, visibleSupplementaryFields } = props;

  const nodeTypeVariables = nodeTypeDefinition.variables;
  const attrs = getEntityAttributes(node);
  const fields = visibleSupplementaryFields;
  const withUUIDReplacement = fields.map((field) => ({
    ...field,
    variable: getParentKeyByNameValue(nodeTypeVariables, field.variable),
  }));

  return withUUIDReplacement.reduce(
    (memo, field) => ({
      ...memo,
      [field.label]: attrs[field.variable],
    }),
    {},
  );
};

// Returns all nodes associated with lists (external data)
const useItems = (props) => {
  const nodeTypeDefinition = usePropSelector(getNodeTypeDefinition, props);
  const [externalData, status] = useExternalData(
    props.stage.dataSource,
    props.stage.subject,
  );
  const networkNodes = usePropSelector(getNetworkNodes, props);
  const visibleSupplementaryFields = usePropSelector(
    getCardAdditionalProperties,
    props,
  );
  const excludeItems = networkNodes.map(
    (item) => item[entityPrimaryKeyProperty],
  );
  const getNodeLabel = useCallback(
    (node) => labelLogic(nodeTypeDefinition, node[entityAttributesProperty]),
    [nodeTypeDefinition],
  );

  const items = useMemo(() => {
    if (!externalData) {
      return [];
    }

    return externalData.map((item) => ({
      id: item[entityPrimaryKeyProperty],
      data: item,
      props: {
        label: getNodeLabel(item),
        data: detailsWithVariableUUIDs({
          ...props,
          nodeTypeDefinition,
          visibleSupplementaryFields,
        })(item),
      },
    }));
  }, [
    externalData,
    getNodeLabel,
    nodeTypeDefinition,
    visibleSupplementaryFields,
    props,
  ]);

  return [status, items, excludeItems];
};

export default useItems;
