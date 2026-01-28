import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';

type Pair = [string, string];

type PairAccumulator = {
  result: Pair[];
  pool: string[];
};

export const getPairs = (nodes: NcNode[]): PairAccumulator => {
  const nodeIds = nodes.map((node) => node[entityPrimaryKeyProperty]);

  const pairs = nodeIds.reduce<PairAccumulator>(
    ({ result, pool }, id) => {
      const nextPool = pool.filter((alterId) => alterId !== id);

      if (nextPool.length === 0) {
        return { result, pool: nextPool };
      }

      const newPairs: Pair[] = nextPool.map((alterId) => [id, alterId]);

      return {
        result: [...result, ...newPairs],
        pool: nextPool,
      };
    },
    { pool: nodeIds, result: [] },
  );

  return pairs;
};

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
