import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getAllVariableUUIDsByEntity } from '../selectors/protocol';
import createSorter, {
  processProtocolSortRule,
  type ProtocolSortRule,
} from '../utils/createSorter';

export default function useSortedNodeList<T extends Record<string, unknown>[]>(
  nodeList: T,
  sortRules?: ProtocolSortRule[],
): T {
  const codebookVariables = useSelector(getAllVariableUUIDsByEntity);
  const ruleProcessor = processProtocolSortRule(codebookVariables);

  const sortedNodeList = useMemo(() => {
    if (!sortRules || sortRules.length === 0) {
      return nodeList;
    }

    const sorter = createSorter(sortRules.map(ruleProcessor));
    return sorter(nodeList);
  }, [nodeList, sortRules, ruleProcessor]);

  return sortedNodeList as T;
}
