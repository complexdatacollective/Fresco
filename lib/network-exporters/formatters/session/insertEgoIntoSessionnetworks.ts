/**
 * Inserts the ego into the nodes and edges of a session network.
 * @param session The session network to insert the ego into.
 * @returns The session network with the ego inserted into the nodes and edges.
 */

import { egoProperty, entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { ZFormattedSessionSchema, type FormattedSession } from './types';
import { ZNcEdge, ZNcEntity, ZNcNode } from '~/shared/schemas/network-canvas';
import { z } from 'zod';

export const ZNodeWithEgo = ZNcNode.extend({
  [egoProperty]: z.string(),
});

export type NodeWithEgo = z.infer<typeof ZNodeWithEgo>;

export const ZEdgeWithEgo = ZNcEdge.extend({
  [egoProperty]: z.string(),
});

export type EdgeWithEgo = z.infer<typeof ZEdgeWithEgo>;

export const ZSessionWithNetworkEgo = ZFormattedSessionSchema.extend({
  nodes: ZNodeWithEgo.array(),
  edges: ZEdgeWithEgo.array(),
  ego: ZNcEntity,
});

export type SessionWithNetworkEgo = z.infer<typeof ZSessionWithNetworkEgo>;

const insertNetworkEgo = (
  session: FormattedSession,
): SessionWithNetworkEgo => ({
  ...session,
  nodes: session.nodes
    ? session.nodes.map((node) => ({
        [egoProperty]: session?.ego[entityPrimaryKeyProperty],
        ...node,
      }))
    : [],
  edges: session.edges
    ? session.edges.map((edge) => ({
        [egoProperty]: session?.ego[entityPrimaryKeyProperty],
        ...edge,
      }))
    : [],
  ego: session.ego ?? {},
});

export const insertEgoIntoSessionNetworks = (sessions: FormattedSession[]) =>
  sessions.map(insertNetworkEgo);
