import type { Codebook } from '@codaco/shared-consts';
import type {
  EdgeWithResequencedID,
  ExportFormat,
  NodeWithResequencedID,
  SessionWithResequencedIDs,
} from '../../utils/types';

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
): (SessionWithResequencedIDs & { partitionEntity?: string })[] => {
  const getEntityName = (uuid: string, type: 'node' | 'edge') =>
    codebook[type]?.[uuid]?.name ?? null;

  switch (format) {
    // For graphml and ego formats, we don't need to do any processing because
    // everything is contained in a single file.
    case 'graphml':
    case 'ego': {
      return [session];
    }
    case 'attributeList': {
      if (!session?.nodes?.length) {
        return [session];
      }

      const partitionedNodeMap = session?.nodes?.reduce(
        (nodeMap, node) => {
          nodeMap[node.type] = nodeMap[node.type] ?? [];
          nodeMap[node.type]!.push(node);
          return nodeMap;
        },
        {} as Record<string, NodeWithResequencedID[]>,
      );

      return Object.entries(partitionedNodeMap).map(([nodeType, nodes]) => ({
        ...session,
        nodes,
        partitionEntity: getEntityName(nodeType, 'node')!,
      }));
    }

    case 'edgeList':
    case 'adjacencyMatrix': {
      if (!session?.edges?.length) {
        return [session];
      }

      const partitionedEdgeMap = session?.edges?.reduce(
        (edgeMap, edge) => {
          edgeMap[edge.type] = edgeMap[edge.type] ?? [];
          edgeMap[edge.type]!.push(edge);
          return edgeMap;
        },
        {} as Record<string, EdgeWithResequencedID[]>,
      );

      return Object.entries(partitionedEdgeMap).map(([edgeType, edges]) => ({
        ...session,
        edges,
        partitionEntity: getEntityName(edgeType, 'edge')!,
      }));
    }
  }
};
