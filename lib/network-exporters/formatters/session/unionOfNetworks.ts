import { sessionProperty } from '@codaco/shared-consts';

/**
 * Combines multiple session networks into a single network. Results in a single session with
 * multiple ego and sessionVariables.
 *
 * @remarks We add the sessionID to each entity so that we can groupBy on it within the exporter to
 * reconstruct the sessions.
 *
 * @param {Object} sessionsByProtocol - An object containing session networks, keyed by protocol UID.
 * @returns {Object} A single session network containing all nodes and edges from the input sessions.
 */
export const unionOfNetworks = (sessionsByProtocol) =>
  Object.keys(sessionsByProtocol).reduce((sessions, protocolUID) => {
    const protocolSessions = sessionsByProtocol[protocolUID].reduce(
      (union, session) => ({
        // Merge node list when union option is selected
        nodes: [
          ...union.nodes,
          ...session.nodes.map((node) => ({
            ...node,
            [sessionProperty]: session.sessionVariables[sessionProperty],
          })),
        ],
        edges: [
          ...union.edges,
          ...session.edges.map((edge) => ({
            ...edge,
            [sessionProperty]: session.sessionVariables[sessionProperty],
          })),
        ],
        ego: {
          ...union.ego,
          [session.sessionVariables[sessionProperty]]: session.ego,
        },
        sessionVariables: {
          ...union.sessionVariables,
          [session.sessionVariables[sessionProperty]]: session.sessionVariables,
        },
      }),
      {
        nodes: [],
        edges: [],
        ego: {},
        sessionVariables: {},
      },
    );
    return {
      ...sessions,
      [protocolUID]: Array(protocolSessions),
    };
  }, {});
