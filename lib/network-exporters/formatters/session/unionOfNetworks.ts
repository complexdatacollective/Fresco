import {
  type NcEdge,
  type NcEgo,
  type NcNode,
  sessionProperty,
} from '@codaco/shared-consts';
import type groupByProtocolProperty from './groupByProtocolProperty';
import type { SessionVariables } from './types';

type NodeWithSessionProperty = NcNode & { [sessionProperty]: string };
type EdgeWithSessionProperty = NcEdge & { [sessionProperty]: string };
type EgoWithSessionProperty = Record<string, NcEgo>;

type NestedSessionProperties = Record<string, SessionVariables>;

type UnifiedSession = {
  nodes: NodeWithSessionProperty[];
  edges: EdgeWithSessionProperty[];
  ego: EgoWithSessionProperty;
  sessionVariables: NestedSessionProperties;
};

/**
 * Combines multiple session networks into a single network. Results in a single session with
 * multiple ego and sessionVariables.
 *
 * @remarks We add the sessionID to each entity so that we can groupBy on it within the exporter to
 * reconstruct the sessions.
 */

export const unionOfNetworks = (
  sessionsByProtocol: ReturnType<typeof groupByProtocolProperty>,
): Record<string, UnifiedSession> => {
  const protocolUIDs = Object.keys(sessionsByProtocol);

  const union = protocolUIDs.reduce(
    (acc, protocolUID) => {
      const currentProtocolSessions = sessionsByProtocol[protocolUID]!;

      const unifiedProtocolSession: UnifiedSession =
        currentProtocolSessions.reduce(
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
              [session.sessionVariables[sessionProperty]]:
                session.sessionVariables,
            },
          }),
          {
            nodes: [],
            edges: [],
            ego: {},
            sessionVariables: {},
          } as UnifiedSession,
        );

      return {
        ...acc,
        [protocolUID]: unifiedProtocolSession,
      };
    },
    {} as Record<string, UnifiedSession>,
  );

  return union;
};

export const handleUnionOption =
  (unifyNetworks: boolean) =>
  (s: ReturnType<typeof groupByProtocolProperty>) => {
    if (!unifyNetworks) {
      return s;
    }

    return unionOfNetworks(s);
  };
