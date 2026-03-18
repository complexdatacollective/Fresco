import { type Filter } from '@codaco/protocol-validation';
import {
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNetwork,
  type NcNode,
} from '@codaco/shared-consts';
import { type NetworkRuleRunner, getRuleFunction } from './rules';

type NetworkRuleResult = { nodes: NcNode[]; edges: NcEdge[] };

const isNetworkRunner = (
  runner: ReturnType<typeof getRuleFunction>,
): runner is NetworkRuleRunner => runner.type !== 'ego';

// remove orphaned edges
const trimEdges = (network: NcNetwork): NcNetwork => {
  const uids = new Set(
    network.nodes.map((node) => node[entityPrimaryKeyProperty]),
  );

  const edges = network.edges.filter(
    ({ from, to }) => uids.has(from) && uids.has(to),
  );

  return {
    ...network,
    edges,
  };
};

/**
 * Returns a method which can filter the network.
 * The returned method takes a network object and returns a network object
 *
 * Example usage:
 *
 * ```
 * import getFilter from 'networkQuery/filter';
 *
 * const config = {
 *   rules: [
 *     {
 *       type: 'alter',
 *       options: { type: 'person', attribute: 'name', operator: 'EXACTLY', value: 'Bill'},
 *     },
 *     {
 *       type: 'edge',
 *       options: { type: 'friend', operator: 'EXISTS' },
 *     },
 *   ],
 *   join: 'AND',
 * };
 *
 * const filter = getFilter(config);
 * const result = filter(network);
 */
const filter = ({
  rules,
  join = 'OR',
}: Filter): ((network: NcNetwork) => NcNetwork) => {
  const ruleRunners = rules.map(getRuleFunction);
  const networkRunners = ruleRunners.filter(isNetworkRunner);

  return (network: NcNetwork): NcNetwork => {
    // AND === feed result of previous rule into next rule
    if (join === 'AND') {
      const result = networkRunners.reduce<NetworkRuleResult>(
        (acc, rule) => rule(acc.nodes, acc.edges),
        { nodes: network.nodes, edges: network.edges },
      );
      return trimEdges({ ...network, ...result });
    }

    /**
     * OR === each rule runs on fresh network, and networks are merged at the end
     *
     * This one is more complicated!
     *
     * Previously, we ran all runners and stored the results in an array. Then we
     * simply reduced the array to a single network object and returned it.
     *
     * This created a bug whereby edges that were between nodes that matched
     * _different_ rules were stripped out, because alter rules were filtering
     * orphaned edges when returning.
     *
     * The solution (below) is to:
     */

    /**
     * 1. first run all node rules, storing the node IDs that survived.
     */
    const alterRuleNetworks = networkRunners
      .filter((rule) => rule.type === 'node')
      .map((rule) => rule(network.nodes, network.edges));

    const survivingAlterIDs = new Set(
      alterRuleNetworks
        .reduce<NcNode[]>((acc, { nodes }) => [...acc, ...nodes], [])
        .map((node) => node[entityPrimaryKeyProperty]),
    );

    /**
     * 2. filter the network edges by these surviving IDs, and merge
     *   the result back into the node rules result.
     */
    const filteredEdges = network.edges.filter(
      (edge) =>
        survivingAlterIDs.has(edge.from) && survivingAlterIDs.has(edge.to),
    );

    const ruleNetworksWithFilteredEdges = alterRuleNetworks.map((n) => ({
      ...n,
      edges: filteredEdges,
    }));

    /**
     * 3. next, the edge rules can be run as normal. IMPORTANT: the fact we don't
     *   run the edge rules with the filtered node ID list means there are probably
     *   now rule ordering issues. We should probably fix this!
     */
    const edgeRuleNetworks = networkRunners
      .filter((rule) => rule.type === 'edge')
      .map((rule) => rule(network.nodes, network.edges));

    const filteredNetworks = [
      ...ruleNetworksWithFilteredEdges,
      ...edgeRuleNetworks,
    ];

    type AccumulatorState = NetworkRuleResult & {
      nodeIds: Set<string>;
      edgeIds: Set<string>;
    };

    /**
     * 4. The combined alter and edge results are then reduced into a single result
     *   object, which has entity uniqueness forced.
     */
    const results = filteredNetworks.reduce<AccumulatorState>(
      (acc, { nodes, edges }) => {
        const nodeIds = new Set(
          nodes.map((node) => node[entityPrimaryKeyProperty]),
        );
        const edgeIds = new Set(
          edges.map((edge) => edge[entityPrimaryKeyProperty]),
        );

        const newNodes = nodes.filter(
          (node) => !acc.nodeIds.has(node[entityPrimaryKeyProperty]),
        );
        const newEdges = edges.filter(
          (edge) => !acc.edgeIds.has(edge[entityPrimaryKeyProperty]),
        );

        return {
          nodes: [...acc.nodes, ...newNodes],
          edges: [...acc.edges, ...newEdges],
          nodeIds: new Set([...acc.nodeIds, ...nodeIds]),
          edgeIds: new Set([...acc.edgeIds, ...edgeIds]),
        };
      },
      {
        nodes: [],
        edges: [],
        nodeIds: new Set<string>(),
        edgeIds: new Set<string>(),
      },
    );

    /**
     * 5. This object has orphaned edges removed, and is returned.
     */
    return trimEdges({
      ...network,
      nodes: results.nodes,
      edges: results.edges,
    });
  };
};

export default filter;
