import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { getNetworkNodesForType } from './session';
import { createDeepEqualSelector } from './utils';

type Pair = [string, string];

type PairAccumulator = {
  result: Pair[];
  pool: string[];
};

export const getNodePairs = createDeepEqualSelector(
  getNetworkNodesForType,
  (nodes) => {
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

    return pairs.result;
  },
);
