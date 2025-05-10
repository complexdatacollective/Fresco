import {
  entityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcEntity,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import useExternalData from '~/lib/interviewer/hooks/useExternalData';
import { getStageCardOptions } from '~/lib/interviewer/selectors/name-generator';
import {
  getNetworkNodes,
  getNodeTypeDefinition,
} from '~/lib/interviewer/selectors/session';
import { getNodeLabelAttribute } from '~/lib/interviewer/utils/getNodeLabelAttribute';
import getParentKeyByNameValue from '~/lib/interviewer/utils/getParentKeyByNameValue';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { type NameGeneratorRosterProps } from './helpers';

/**
 * Format details needed for list cards
 */
const detailsWithVariableUUIDs =
  (
    props: NameGeneratorRosterProps & {
      nodeTypeDefinition: ReturnType<typeof getNodeTypeDefinition>;
      visibleSupplementaryFields: ReturnType<
        typeof getStageCardOptions
      >['additionalProperties'];
    },
  ) =>
  (node: NcNode) => {
    const { nodeTypeDefinition, visibleSupplementaryFields } = props;

    invariant(
      nodeTypeDefinition,
      'Node type definition is required to format details',
    );

    invariant(
      visibleSupplementaryFields,
      'Visible supplementary fields are required to format details',
    );

    const nodeTypeVariables = nodeTypeDefinition.variables;
    const attrs = getEntityAttributes(node);
    const fields = visibleSupplementaryFields;
    const withUUIDReplacement = fields.map((field) => ({
      ...field,
      variable: getParentKeyByNameValue(nodeTypeVariables, field.variable),
    }));

    return withUUIDReplacement.reduce(
      (acc, field) => ({
        ...acc,
        [field.label]: attrs[field.variable],
      }),
      {} as Record<string, VariableValue | undefined>,
    );
  };

export type UseItemElement = {
  id: NcEntity[EntityPrimaryKey];
  data: NcNode;
  props: NameGeneratorRosterProps & {
    label: string;
    data: ReturnType<ReturnType<typeof detailsWithVariableUUIDs>>;
  };
};

// Returns all nodes associated with external data
const useItems = (props: NameGeneratorRosterProps) => {
  const nodeTypeDefinition = useSelector(getNodeTypeDefinition);
  const { externalData, status } = useExternalData(
    props.stage.dataSource,
    props.stage.subject,
  );
  const networkNodes = useSelector(getNetworkNodes);
  const cardOptions = useSelector(getStageCardOptions);

  const excludeItems = networkNodes.map(
    (item) => item[entityPrimaryKeyProperty],
  );

  // It is safe to ignore the encryption state here because this is external
  // data, meaning we do not expect it to be encrypted.
  // TODO: this must be updated if we want rosters to support encrypted data.
  const getNodeLabel = useCallback((node: NcNode) => {
    const attribute = getNodeLabelAttribute(
      undefined,
      node[entityAttributesProperty],
    );

    if (attribute) {
      return String(
        node[entityAttributesProperty][attribute] as string | number,
      );
    }

    return node[entityPrimaryKeyProperty];
  }, []);

  const items = useMemo(() => {
    if (!externalData) {
      return [] as UseItemElement[];
    }

    return externalData.map((item) => ({
      id: item[entityPrimaryKeyProperty],
      data: item,
      props: {
        label: getNodeLabel(item),
        data: detailsWithVariableUUIDs({
          ...props,
          nodeTypeDefinition,
          visibleSupplementaryFields: cardOptions.additionalProperties,
        })(item),
      },
    })) as UseItemElement[];
  }, [
    externalData,
    getNodeLabel,
    nodeTypeDefinition,
    cardOptions.additionalProperties,
    props,
  ]);

  return { status, items, excludeItems };
};

export default useItems;
