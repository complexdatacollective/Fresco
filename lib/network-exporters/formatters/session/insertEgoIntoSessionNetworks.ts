/**
 * Inserts the ego into the nodes and edges of a session network.
 * @param session The session network to insert the ego into.
 * @returns The session network with the ego inserted into the nodes and edges.
 */

import { egoProperty, entityPrimaryKeyProperty } from '@codaco/shared-consts';
import type {
  FormattedSession,
  SessionWithNetworkEgo,
} from '../../utils/types';

const insertNetworkEgo = (
  session: FormattedSession,
): SessionWithNetworkEgo => ({
  ...session,
  nodes: session.nodes
    ? session.nodes.map((node) => ({
        [egoProperty]: session.ego[entityPrimaryKeyProperty],
        ...node,
      }))
    : [],
  edges: session.edges
    ? session.edges.map((edge) => ({
        [egoProperty]: session?.ego[entityPrimaryKeyProperty],
        ...edge,
      }))
    : [],
});

export const insertEgoIntoSessionNetworks = (sessions: FormattedSession[]) =>
  sessions.map(insertNetworkEgo);
