import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';
import { getEntityAttributes } from '../../../ducks/modules/network';
import useExternalData from '../../../hooks/useExternalData';
import usePropSelector from '../../../hooks/usePropSelector';
import { getCardAdditionalProperties } from '../../../selectors/name-generator';
import {
  getNetworkNodes,
  getNodeTypeDefinition,
  labelLogic,
} from '../../../selectors/network';
import getParentKeyByNameValue from '../../../utils/getParentKeyByNameValue';

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
  const stage = useSelector(getCurrentStage);


  const nodeTypeDefinition = usePropSelector(getNodeTypeDefinition, props);
  const { data: externalData, isLoading, error } = useExternalData(stage.dataSource);
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

  return [{ isLoading, error }, items, excludeItems];
};

export default useItems;
