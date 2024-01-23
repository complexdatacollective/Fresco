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

import { type Interview, type Protocol } from '@prisma/client';
import { hash } from 'ohash';

type InterviewsWithProtocol = (Interview & { protocol: Protocol })[];

/**
 * Creates an object containing all required session metadata for export
 * and appends it to the session
 */

export const formatExportableSessions = (sessions: InterviewsWithProtocol) =>
  sessions.map((session) => {
    const sessionProtocol = session.protocol;

    if (!sessionProtocol) return;

    const sessionVariables = {
      [caseProperty]: session.id,
      [sessionProperty]: session.id,
      [protocolProperty]: sessionProtocol.hash,
      [protocolName]: sessionProtocol.name,
      [codebookHashProperty]: hash(sessionProtocol.codebook),
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

export type FormattedSessions = ReturnType<typeof formatExportableSessions>;
