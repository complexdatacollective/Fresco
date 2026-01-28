import { type Prompt } from '@codaco/protocol-validation';
import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { isNil } from 'es-toolkit';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeGetVariableOptions } from '../../selectors/interface';
import { getPromptVariable } from '../../selectors/prop';
import { getNetworkNodesForType } from '../../selectors/session';
import { type ProcessedSortRule } from '../../utils/createSorter';

export type OrdinalBinPrompt = Prompt & {
  bucketSortOrder?: ProcessedSortRule[];
  binSortOrder?: ProcessedSortRule[];
  color?: string;
};

export type OrdinalBinItem = {
  label: string;
  value: number;
  nodes: NcNode[];
};

type UseOrdinalBinsResult = {
  bins: OrdinalBinItem[];
  activePromptVariable: string | undefined;
};

/**
 * Hook that provides bins with their nodes for OrdinalBin interface.
 *
 * This hook extracts the selector logic from the legacy OrdinalBins component
 * and provides a typed interface for accessing bin data.
 */
export function useOrdinalBins(): UseOrdinalBinsResult {
  const stageNodes = useSelector(getNetworkNodesForType);
  const activePromptVariable = useSelector(getPromptVariable);

  const getOrdinalValues = useMemo(() => makeGetVariableOptions(), []);
  const ordinalOptions = useSelector(getOrdinalValues);

  const bins: OrdinalBinItem[] = useMemo(() => {
    return ordinalOptions.map((option) => {
      const nodes = stageNodes.filter(
        (node) =>
          !isNil(node[entityAttributesProperty][activePromptVariable!]) &&
          node[entityAttributesProperty][activePromptVariable!] === option.value,
      );

      return {
        label: option.label ?? '',
        value: option.value as number,
        nodes,
      };
    });
  }, [ordinalOptions, stageNodes, activePromptVariable]);

  return {
    bins,
    activePromptVariable,
  };
}
