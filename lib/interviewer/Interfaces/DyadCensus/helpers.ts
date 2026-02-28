import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { type DyadCensusMetadataItem } from '~/lib/interviewer/ducks/modules/session';

type Pair = [string, string];

const getNode = (nodes: NcNode[], id: string): NcNode | undefined =>
  nodes.find((node) => node[entityPrimaryKeyProperty] === id);

export const getNodePair = (
  nodes: NcNode[],
  pair: Pair | null,
): [NcNode | undefined, NcNode | undefined] => {
  if (!pair) {
    return [undefined, undefined];
  }
  return [getNode(nodes, pair[0]), getNode(nodes, pair[1])];
};

export const matchEntry =
  (promptIndex: number, pair: Pair) =>
  ([p, a, b]: DyadCensusMetadataItem) =>
    (p === promptIndex && a === pair[0] && b === pair[1]) ||
    (p === promptIndex && b === pair[0] && a === pair[1]);

export const isDyadCensusMetadata = (
  state: unknown,
): state is DyadCensusMetadataItem[] => {
  return (
    Array.isArray(state) &&
    state.every(
      (item) =>
        Array.isArray(item) &&
        item.length === 4 &&
        typeof item[0] === 'number' &&
        typeof item[1] === 'string' &&
        typeof item[2] === 'string' &&
        typeof item[3] === 'boolean',
    )
  );
};

export const getStageMetadataResponse = (
  state: unknown,
  promptIndex: number,
  pair: Pair,
) => {
  if (!isDyadCensusMetadata(state) || pair.length !== 2) {
    return { exists: false, value: undefined };
  }

  const answer = state.find(matchEntry(promptIndex, pair));
  return {
    exists: !!answer,
    value: answer ? answer[3] : undefined,
  };
};
