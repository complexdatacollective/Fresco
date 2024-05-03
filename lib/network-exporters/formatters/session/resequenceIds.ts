import {
  entityPrimaryKeyProperty,
  ncSourceUUID,
  ncTargetUUID,
  nodeExportIDProperty,
} from '@codaco/shared-consts';

/**
 * Resequences the IDs of the nodes and edges in the sessions.
 * @param sessionsByProtocol The sessions to resequence.
 * @returns The sessions with resequenced IDs.
 */
export const resequenceIds = (sessionsByProtocol) => {
  const resequenceEntities = (target) =>
    target.map((session) => {
      let resequencedNodeId = 0;
      let resequencedEdgeId = 0;
      const IDLookupMap = {}; // Create a lookup object { [oldID] -> [incrementedID] }

      return {
        ...session,
        nodes: session?.nodes?.map((node) => {
          resequencedNodeId += 1;
          IDLookupMap[node[entityPrimaryKeyProperty]] = resequencedNodeId;
          return {
            [nodeExportIDProperty]: resequencedNodeId,
            ...node,
          };
        }),
        edges: session?.edges?.map((edge) => {
          resequencedEdgeId += 1;
          IDLookupMap[edge[entityPrimaryKeyProperty]] = resequencedEdgeId;
          return {
            ...edge,
            [ncSourceUUID]: edge[edgeSourceProperty],
            [ncTargetUUID]: edge[edgeTargetProperty],
            [edgeExportIDProperty]: resequencedEdgeId,
            from: IDLookupMap[edge[edgeSourceProperty]],
            to: IDLookupMap[edge[edgeTargetProperty]],
          };
        }),
      };
    });

  return Object.keys(sessionsByProtocol).reduce(
    (sessions, protocolUID) => ({
      ...sessions,
      [protocolUID]: resequenceEntities(sessionsByProtocol[protocolUID]),
    }),
    {},
  );
};
