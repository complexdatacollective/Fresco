import { type Stage } from '@codaco/protocol-validation';
import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { invariant, isNil } from 'es-toolkit';
import { useSelector } from 'react-redux';
import { usePrompts } from '../../components/Prompts/usePrompts';
import useSortedNodeList from '../../hooks/useSortedNodeList';
import { makeGetCodebookVariableById } from '../../selectors/protocol';
import { getNetworkNodesForType } from '../../selectors/session';

export type OrdinalBinItem = {
  label: string;
  value: string | number | boolean;
  nodes: NcNode[];
};

type OrdinalBinPrompts = Extract<
  Stage,
  { type: 'OrdinalBin' }
>['prompts'][number];

export function useOrdinalBins() {
  const stageNodes = useSelector(getNetworkNodesForType);
  const {
    prompt: { variable: activePromptVariable, bucketSortOrder },
  } = usePrompts<OrdinalBinPrompts>();

  const getVariableDefinition = useSelector(makeGetCodebookVariableById);
  const variableDefinition = getVariableDefinition(activePromptVariable);

  invariant(
    variableDefinition?.type === 'ordinal',
    `Variable with ID ${activePromptVariable} is not an ordinal variable`,
  );

  const ordinalOptions = variableDefinition.options;

  const bins: OrdinalBinItem[] = ordinalOptions.map((option) => {
    const nodes = stageNodes.filter((node) => {
      const attrValue = node[entityAttributesProperty][activePromptVariable];
      return (
        attrValue !== undefined &&
        attrValue !== null &&
        attrValue === option.value
      );
    });

    return {
      label: option.label,
      value: option.value,
      nodes,
    };
  });

  const unplacedNodes = stageNodes.filter((node) =>
    isNil(node[entityAttributesProperty][activePromptVariable]),
  );

  const sortedUnplacedNodes = useSortedNodeList(unplacedNodes, bucketSortOrder);

  return {
    bins,
    unplacedNodes: sortedUnplacedNodes,
  };
}
