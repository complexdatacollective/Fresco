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

import type { Interview, Protocol, Participant } from '@prisma/client';
import { hash } from 'ohash';
import { env } from '~/env.mjs';

type InterviewsWithProtocol = (Interview & { protocol: Protocol } & {
  participant: Participant;
})[];

type FormattedSession = {
  sessionNetwork: object;
  sessionVariables: {
    [caseProperty]: string;
    [sessionProperty]: string;
    [protocolProperty]: string;
    [protocolName]: string;
    [codebookHashProperty]: string;
    [sessionExportTimeProperty]: string;
    [sessionStartTimeProperty]?: string;
    [sessionFinishTimeProperty]?: string;
    COMMIT_HASH: string;
    APP_VERSION: string;
  };
};

export type FormattedSessions = FormattedSession[];

/**
 * Creates an object containing all required session metadata for export
 * and appends it to the session
 */

export const formatExportableSessions = (sessions: InterviewsWithProtocol) =>
  sessions.map((session) => {
    const sessionProtocol = session.protocol;
    const sessionParticipant = session.participant;

    if (!sessionProtocol) return;

    const sessionVariables = {
      [caseProperty]: sessionParticipant.label,
      [sessionProperty]: sessionParticipant.identifier,
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
      COMMIT_HASH: env.COMMIT_HASH,
      APP_VERSION: env.APP_VERSION,
    };

    const sessionNetwork = JSON.parse(
      JSON.stringify(session.network),
    ) as object;

    return {
      ...sessionNetwork,
      sessionVariables,
    };
  });
