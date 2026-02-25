import { type Prompt, type SortOrder } from '@codaco/protocol-validation';
import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  makeGetVariableOptions,
  getUncategorisedNodes,
} from '../../selectors/interface';
import {
  getPromptOtherVariable,
  getPromptVariable,
} from '../../selectors/prop';
import { getNetworkNodesForType } from '../../selectors/session';

export type CategoricalBinPrompt = Prompt & {
  bucketSortOrder?: SortOrder;
  binSortOrder?: SortOrder;
};

export type CategoricalBin = {
  label: string;
  value: number | string | null;
  nodes: NcNode[];
  otherVariable?: string;
  otherVariablePrompt?: string;
};

type UseCategoricalBinsResult = {
  bins: CategoricalBin[];
  activePromptVariable: string | undefined;
  promptOtherVariable: string | undefined;
  uncategorisedNodes: NcNode[];
};

const matchVariable = (
  node: NcNode,
  variable: string,
  value: number | string | null,
) => {
  const nodeValue = node[entityAttributesProperty][variable];
  if (!nodeValue) return false;

  if (Array.isArray(nodeValue) && value !== null) {
    return (nodeValue as (string | number | boolean)[]).includes(value);
  }

  return nodeValue === value;
};

const hasOtherVariable = (node: NcNode, otherVariable?: string) =>
  otherVariable &&
  node[entityAttributesProperty][otherVariable] !== null &&
  node[entityAttributesProperty][otherVariable] !== undefined;

export function useCategoricalBins(): UseCategoricalBinsResult {
  const stageNodes = useSelector(getNetworkNodesForType);
  const activePromptVariable = useSelector(getPromptVariable);
  const [promptOtherVariable] = useSelector(getPromptOtherVariable);
  const uncategorisedNodes = useSelector(getUncategorisedNodes);

  const getCategoricalValues = useMemo(() => makeGetVariableOptions(true), []);
  const categoricalOptions = useSelector(getCategoricalValues);

  const bins: CategoricalBin[] = useMemo(() => {
    return categoricalOptions.map((option) => {
      const otherVar = (option as { otherVariable?: string }).otherVariable;
      const otherVarPrompt = (option as { otherVariablePrompt?: string })
        .otherVariablePrompt;

      const nodes = stageNodes.filter((node) => {
        if (otherVar) {
          return hasOtherVariable(node, otherVar);
        }
        return matchVariable(
          node,
          activePromptVariable!,
          option.value as number | string | null,
        );
      });

      return {
        label: option.label ?? '',
        value: option.value as number | string | null,
        nodes,
        ...(otherVar ? { otherVariable: otherVar } : {}),
        ...(otherVarPrompt ? { otherVariablePrompt: otherVarPrompt } : {}),
      };
    });
  }, [categoricalOptions, stageNodes, activePromptVariable]);

  return {
    bins,
    activePromptVariable,
    promptOtherVariable,
    uncategorisedNodes,
  };
}
