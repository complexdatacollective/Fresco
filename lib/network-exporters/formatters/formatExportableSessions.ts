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
import type { getInterviewsForExport } from '~/queries/interviews';
import type { NcNetwork } from '~/schemas/network-canvas';
import { type SessionVariables } from '../utils/types';

/**
 * Creates an object containing all required session metadata for export
 * and appends it to the session
 */

export const formatExportableSessions = (
  sessions: Awaited<ReturnType<typeof getInterviewsForExport>>,
) => {
  return sessions.map((session) => {
    const sessionProtocol = session.protocol;
    const sessionParticipant = session.participant;

    const getCaseProperty = () => {
      if (sessionParticipant.label && sessionParticipant.label !== '') {
        return sessionParticipant.label;
      }

      return sessionParticipant.identifier;
    };

    const sessionVariables: SessionVariables = {
      // Label is optional, but defaults to an empty string!
      // We **must** fallback to identifier in this case, because caseProperty
      // is used to create the filename during export.
      [caseProperty]: getCaseProperty(),
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
      COMMIT_HASH: env.COMMIT_HASH!,
      APP_VERSION: env.APP_VERSION!,
    };

    const sessionNetwork = session.network as unknown as NcNetwork;

    return {
      ...sessionNetwork,
      sessionVariables,
    };
  });
};
