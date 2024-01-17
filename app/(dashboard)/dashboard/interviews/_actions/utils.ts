import {
  caseProperty,
  codebookHashProperty,
  protocolName,
  protocolProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '@codaco/shared-consts';

import objectHash from 'object-hash';
import { type Interview, type Protocol } from '@prisma/client';
import crypto from 'crypto';

/**
 * Creates an object containing all required session metadata for export
 * and appends it to the session
 */

export const formatExportableSessions = (
  sessions: Interview[],
  protocols: Protocol[],
) =>
  sessions.map((session) => {
    const sessionProtocol = protocols.find(
      (protocol) => protocol.id === session.protocolId,
    );

    if (!sessionProtocol) return;

    const sessionVariables = {
      [caseProperty]: session.id,
      [sessionProperty]: session.id,
      [protocolProperty]: getRemoteProtocolID(sessionProtocol.name),
      [protocolName]: sessionProtocol.name,
      [codebookHashProperty]: objectHash(sessionProtocol.codebook),
      ...(session.startTime && {
        [sessionStartTimeProperty]: new Date(session.startTime).toISOString(),
      }),
      ...(session.finishTime && {
        [sessionFinishTimeProperty]: new Date(session.finishTime).toISOString(),
      }),
      [sessionExportTimeProperty]: new Date().toISOString(),
    };

    const sessionNetwork = JSON.parse(
      JSON.stringify(session.network),
    ) as object;

    return {
      ...sessionNetwork,
      sessionVariables,
    };
  });

export const getRemoteProtocolID = (name: string) =>
  name && crypto.createHash('sha256').update(name).digest('hex');

export type FormattedSessions = ReturnType<typeof formatExportableSessions>;
