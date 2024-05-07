import {
  edgeExportIDProperty,
  edgeSourceProperty,
  edgeTargetProperty,
  entityPrimaryKeyProperty,
  ncSourceUUID,
  ncTargetUUID,
  nodeExportIDProperty,
} from '@codaco/shared-consts';
import {
  ZUnifiedSession,
  ZNodeWithSessionProperty,
  ZEdgeWithSessionProperty,
  type UnifiedSession,
} from './unionOfNetworks';
import { z } from 'zod';
import type { SessionsByProtocol } from './groupByProtocolProperty';
import { ZSessionWithNetworkEgo } from './insertEgoIntoSessionnetworks';

const ZNodeWithResequencedID = ZNodeWithSessionProperty.extend({
  [nodeExportIDProperty]: z.number(),
});

export type NodeWithResequencedID = z.infer<typeof ZNodeWithResequencedID>;

const ZEdgeWithResequencedID = ZEdgeWithSessionProperty.extend({
  [edgeExportIDProperty]: z.number(),
  from: z.number(),
  to: z.number(),
});

export type EdgeWithResequencedID = z.infer<typeof ZEdgeWithResequencedID>;

export const ZSessionWithResequencedIDs = ZSessionWithNetworkEgo.extend({
  nodes: ZNodeWithResequencedID.array(),
  edges: ZEdgeWithResequencedID.array(),
});

export type SessionWithResequencesIDs = z.infer<
  typeof ZSessionWithResequencedIDs
>;

const resequenceEntities = (target: UnifiedSession[]) => {
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
          from: IDLookupMap[edge[edgeSourceProperty]],
          to: IDLookupMap[edge[edgeTargetProperty]],
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
  const result: Record<string, ZO[]> = {};

  Object.entries(sessionsByProtocol).forEach(([protocol, sessions]) => {
    result[protocol] = resequenceEntities(sessions);
  });

  return result;
};
