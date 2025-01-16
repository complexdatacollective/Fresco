import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { NcNode } from '~/schemas/network-canvas';
import useExternalData from '../hooks/useExternalData';
import {
  getNetworkNodesForOtherPrompts,
  getNetworkNodesForPrompt,
} from '../selectors/interface';
import { getCurrentStage } from '../selectors/session';

const notInSet = (set: Set<string>) => (node: NcNode) =>
  !set.has(node[entityPrimaryKeyProperty]);

/**
 * Hook meant to replace withExternalData HOC
 */
export default function usePanelData({ dataSource }: { dataSource: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NcNode[] | null>(null);

  const stage = useSelector(getCurrentStage);
  const nodesForPrompt = useSelector((state) =>
    getNetworkNodesForPrompt(state, { stage }),
  );
  const nodesForOtherPrompts = useSelector((state) =>
    getNetworkNodesForOtherPrompts(state, { stage }),
  );

  const nodeIds = useMemo(
    () => ({
      prompt: nodesForPrompt.map((node) => node[entityPrimaryKeyProperty]),
      other: nodesForOtherPrompts.map((node) => node[entityPrimaryKeyProperty]),
    }),
    [nodesForPrompt, nodesForOtherPrompts],
  );

  const usingExternalData = useMemo(
    () => dataSource !== 'existing',
    [dataSource],
  );

  const {
    data,
    isLoading: isLoadingExternalData,
    // isError: isErrorExternalData,
  } = useExternalData(usingExternalData ? dataSource : undefined);

  useEffect(() => {
    if (usingExternalData) {
      setIsLoading(isLoadingExternalData);
    }
  }, [isLoadingExternalData, usingExternalData]);

  useEffect(() => {
    if (usingExternalData) {
      if (data) {
        setNodes(data);
        setIsLoading(false);
      }
    }
  }, [data, usingExternalData]);

  useEffect(() => {
    if (!usingExternalData) {
      setIsLoading(false);
      const nodes = nodesForOtherPrompts.filter(
        notInSet(new Set(nodeIds.prompt)),
      );

      setNodes(nodes);
    }
  }, [usingExternalData, nodesForOtherPrompts, nodeIds.prompt]);

  /**
   * Two scnearios:
   *
   * - External data: need to fetch data from external source. Historically this
   *   would have been reading a file from disk, but now it will be a fetch
   *   request. Will involve parsing the node list and returning it.
   * - Existing network: will involve using network selectors to get nodes in
   *   the interview network that are not in the current prompt.
   */

  return {
    nodes,
    isLoading,
    error,
  };
}
