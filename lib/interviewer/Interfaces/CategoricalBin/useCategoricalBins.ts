import { type Stage } from '@codaco/protocol-validation';
import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useSelector } from 'react-redux';
import { usePrompts } from '../../components/Prompts/usePrompts';
import useSortedNodeList, {
  getSortedNodeList,
} from '../../hooks/useSortedNodeList';
import {
  getAllVariableUUIDsByEntity,
  makeGetCodebookVariableById,
} from '../../selectors/protocol';
import { getNetworkNodesForType } from '../../selectors/session';

const matchVariableValue = (
  node: NcNode,
  variable: string,
  value: string | number | boolean,
) => {
  const variableValue = node[entityAttributesProperty][variable];

  if (variableValue === undefined || variableValue === null) return false;

  if (Array.isArray(variableValue)) {
    return variableValue.some((v) => v === value);
  }

  return variableValue === value;
};

type CategoricalBinPrompts = Extract<
  Stage,
  { type: 'CategoricalBin' }
>['prompts'][number];

export function useCategoricalBins() {
  const stageNodes = useSelector(getNetworkNodesForType);
  const {
    prompt: {
      variable: activePromptVariable,
      otherVariable,
      otherOptionLabel,
      bucketSortOrder,
    },
  } = usePrompts<CategoricalBinPrompts>();

  const codebookVariables = useSelector(getAllVariableUUIDsByEntity);
  const getVariableDefinition = useSelector(makeGetCodebookVariableById);
  const variableDefinition = getVariableDefinition(activePromptVariable);

  const categoricalOptions =
    variableDefinition && 'options' in variableDefinition
      ? variableDefinition.options!
      : [];

  // Calculate uncategorised nodes by filtering stageNodes to those that don't have a value for either the active prompt variable or the other variable
  const uncategorisedNodes = stageNodes.filter((node) => {
    const attributes = node[entityAttributesProperty];

    const activeVarExists = activePromptVariable
      ? !!attributes[activePromptVariable]
      : false;
    const otherVarExists = otherVariable ? !!attributes[otherVariable] : false;

    return !activeVarExists && !otherVarExists;
  });

  const sortedUncategorisedNodes = useSortedNodeList(
    uncategorisedNodes,
    bucketSortOrder,
  );

  type Bin = {
    label: string;
    nodes: NcNode[];
    value: string | number | boolean | null;
    isOther: boolean;
  };

  const bins: Bin[] = categoricalOptions.map((option) => {
    // Filter nodes
    const nodes = stageNodes.filter((node) => {
      return matchVariableValue(node, activePromptVariable, option.value);
    });

    const sortedNodes = getSortedNodeList(
      nodes,
      bucketSortOrder,
      codebookVariables,
    );

    return {
      label: option.label,
      nodes: sortedNodes,
      value: option.value,
      isOther: false,
    };
  });

  // Handle 'other' bin
  if (otherVariable && otherOptionLabel) {
    const otherNodes = stageNodes.filter(
      (node) =>
        get(node, [entityAttributesProperty, otherVariable]) !== undefined,
    );

    const sortedOtherNodes = getSortedNodeList(
      otherNodes,
      bucketSortOrder,
      codebookVariables,
    );

    bins.push({
      label: otherOptionLabel,
      nodes: sortedOtherNodes,
      value: null,
      isOther: true,
    });
  }

  return {
    bins,
    uncategorisedNodes: sortedUncategorisedNodes,
  };
}
