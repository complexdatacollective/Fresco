import type { Codebook } from '@codaco/shared-consts';
import type { ExportFormat } from './exportFile';
import type { SessionWithResequencedIDs } from './resequenceIds';

/**
 * Partition a network as needed for edge-list and adjacency-matrix formats.
 * Each network contains a reference to the original nodes, with a subset of edges
 * based on the type.
 *
 * @param  {Object} codebook
 * @param  {Object} session in NC format
 * @param  {string} format one of `formats`
 * @return {Array} An array of networks, partitioned by type. Each network object is decorated
 *                 with an additional `partitionEntity` prop to facilitate format naming.
 */
export const partitionByType = (
  codebook: Codebook,
  session: SessionWithResequencedIDs,
  format: ExportFormat,
) => {
  const getEntityName = (uuid: string, type: 'node' | 'edge') =>
    codebook[type]?.[uuid]?.name ?? null;

  switch (format) {
    case 'graphml':
    case 'ego': {
      return [session];
    }
    case 'attributeList': {
      if (!session?.nodes?.length) {
        return [session];
      }

      const partitionedNodeMap = session?.nodes?.reduce((nodeMap, node) => {
        nodeMap[node.type] = nodeMap[node.type] || []; // eslint-disable-line no-param-reassign
        nodeMap[node.type].push(node);
        return nodeMap;
      }, {});

      return Object.entries(partitionedNodeMap).map(([nodeType, nodes]) => ({
        ...session,
        nodes,
        partitionEntity: getEntityName(nodeType, 'node'),
      }));
    }
    case 'edgeList':
    case 'adjacencyMatrix': {
      if (!session?.edges?.length) {
        return [session];
      }

      const partitionedEdgeMap = session?.edges?.reduce((edgeMap, edge) => {
        edgeMap[edge.type] = edgeMap[edge.type] || []; // eslint-disable-line no-param-reassign
        edgeMap[edge.type].push(edge);
        return edgeMap;
      }, {});

      return Object.entries(partitionedEdgeMap).map(([edgeType, edges]) => ({
        ...session,
        edges,
        partitionEntity: getEntityName(edgeType, 'edge'),
      }));
    }
    default:
      throw new Error('Unexpected format', format);
  }
};
