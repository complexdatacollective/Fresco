import { sessionProperty } from '@codaco/shared-consts';
import { ZSessionVariables } from './types';
import { ZNodeWithEgo, ZEdgeWithEgo } from './insertEgoIntoSessionnetworks';
import { z } from 'zod';
import { ZNcEntity } from '~/shared/schemas/network-canvas';
import { type SessionsByProtocol } from './groupByProtocolProperty';

export const ZNodeWithSessionProperty = ZNodeWithEgo.extend({
  [sessionProperty]: z.string().optional(),
});

export type NodeWithSessionProperty = z.infer<typeof ZNodeWithSessionProperty>;

export const ZEdgeWithSessionProperty = ZEdgeWithEgo.extend({
  [sessionProperty]: z.string().optional(),
});

export type EdgeWithSessionProperty = z.infer<typeof ZEdgeWithSessionProperty>;

export const ZEgoWithSessionProperty = z.record(z.string(), ZNcEntity);

export type EgoWithSessionProperty = z.infer<typeof ZEgoWithSessionProperty>;

export const ZSessionVariablesWithProperty = z.record(
  z.string(),
  ZSessionVariables,
);

export const ZUnifiedSession = z.object({
  nodes: ZNodeWithSessionProperty.array(),
  edges: ZEdgeWithSessionProperty.array(),
  ego: z.union([ZEgoWithSessionProperty, ZNcEntity]),
  sessionVariables: z.union([ZSessionVariablesWithProperty, ZSessionVariables]),
});

export type UnifiedSession = z.infer<typeof ZUnifiedSession>;

export const ZUnifiedSessionsByProtocol = z.record(
  z.string(),
  z.array(ZUnifiedSession),
);

export type UnifiedSessionsByProtocol = z.infer<
  typeof ZUnifiedSessionsByProtocol
>;

/**
 * Combines multiple session networks into a single network. Results in a single session with
 * multiple ego and sessionVariables.
 *
 * @remarks We add the sessionID to each entity so that we can groupBy on it within the exporter to
 * reconstruct the sessions.
 */
export const unionOfNetworks = (
  sessionsByProtocol: SessionsByProtocol,
): UnifiedSessionsByProtocol => {
  const result = {} as UnifiedSessionsByProtocol;

  Object.entries(sessionsByProtocol).forEach(([protocol, sessions]) => {
    const combinedSession = sessions.reduce(
      (acc, session) => ({
        nodes: [
          ...acc.nodes,
          ...session.nodes.map((node) => ({
            ...node,
            [sessionProperty]: session.sessionVariables[sessionProperty],
          })),
        ],
        edges: [
          ...acc.edges,
          ...session.edges.map((edge) => ({
            ...edge,
            [sessionProperty]: session.sessionVariables[sessionProperty],
          })),
        ],
        ego: {
          ...acc.ego,
          [session.sessionVariables[sessionProperty]]: session.ego,
        },
        sessionVariables: {
          ...acc.sessionVariables,
          [session.sessionVariables[sessionProperty]]: session.sessionVariables,
        },
      }),
      {
        nodes: [],
        edges: [],
        ego: {},
        sessionVariables: {},
      } as UnifiedSession,
    );

    result[protocol] = Array(combinedSession);
  });

  return result;
};

export const handleUnionOption =
  (unifyNetworks: boolean) =>
  (s: SessionsByProtocol): UnifiedSessionsByProtocol => {
    if (!unifyNetworks) {
      return s;
    }

    return unionOfNetworks(s);
  };
