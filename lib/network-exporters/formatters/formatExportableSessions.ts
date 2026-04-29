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
import { hash } from 'ohash';
import { env } from '~/env';
import type { InterviewExportInput } from '~/lib/network-exporters/input';
import { type SessionVariables } from '../input';

/**
 * Creates an object containing all required session metadata for export
 * and appends it to the session
 */

export const formatExportableSessions = (sessions: InterviewExportInput[]) => {
  return sessions.map((session) => {
    const sessionProtocol = session.protocol;

    const sessionVariables: SessionVariables = {
      [caseProperty]: session.participantIdentifier,
      [sessionProperty]: session.id,
      [protocolProperty]: sessionProtocol.hash,
      [protocolName]: sessionProtocol.name,
      [codebookHashProperty]: hash(sessionProtocol.codebook),
      [sessionStartTimeProperty]: session.startTime.toISOString(),
      [sessionFinishTimeProperty]:
        session.finishTime?.toISOString() ?? undefined,
      [sessionExportTimeProperty]: new Date().toISOString(),
      COMMIT_HASH: env.COMMIT_HASH!,
      APP_VERSION: env.APP_VERSION!,
    };

    return {
      ...session.network,
      sessionVariables,
    };
  });
};
