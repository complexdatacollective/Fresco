import {
  edgeExportIDProperty,
  edgeSourceProperty,
  edgeTargetProperty,
  entityPrimaryKeyProperty,
  ncSourceUUID,
  ncTargetUUID,
  nodeExportIDProperty,
} from '@codaco/shared-consts';
import type {
  SessionWithNetworkEgo,
  SessionWithResequencedIDs,
  SessionsByProtocol,
} from '../../utils/types';

const resequenceEntities = (
  target: SessionWithNetworkEgo[],
): SessionWithResequencedIDs[] => {
  return target.map((session) => {
    let resequencedNodeId = 0;
    let resequencedEdgeId = 0;

    // Create a lookup object { [oldID] -> [incrementedID] } so we can update
    // the edge source and target properties with the new IDs.
    const IDLookupMap: Record<string, number> = {};

    return {
      ...session,
      nodes: session?.nodes?.map((node) => {
        resequencedNodeId++;
        IDLookupMap[node[entityPrimaryKeyProperty]] = resequencedNodeId;
        return {
          [nodeExportIDProperty]: resequencedNodeId,
          ...node,
        };
      }),
      edges: session?.edges?.map((edge) => {
        resequencedEdgeId++;
        IDLookupMap[edge[entityPrimaryKeyProperty]] = resequencedEdgeId;
        return {
          ...edge,
          [ncSourceUUID]: edge[edgeSourceProperty],
          [ncTargetUUID]: edge[edgeTargetProperty],
          [edgeExportIDProperty]: resequencedEdgeId,
          from: IDLookupMap[edge[edgeSourceProperty]]!,
          to: IDLookupMap[edge[edgeTargetProperty]]!,
        };
      }),
    };
  });
};

/**
 * Adds sequential IDs to the nodes and edges in the session to help researchers
 * that have limited experience with working with data.
 */
export const resequenceIds = (sessionsByProtocol: SessionsByProtocol) => {
  const result: Record<string, SessionWithResequencedIDs[]> = {};

  Object.entries(sessionsByProtocol).forEach(([protocol, sessions]) => {
    result[protocol] = resequenceEntities(sessions);
  });

  return result;
};
