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
import { env } from '~/env.mjs';
import type { getInterviewsForExport } from '~/queries/interviews';
import type { NcNetwork } from '~/schemas/network-canvas';

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

    const sessionVariables = {
      [caseProperty]: sessionParticipant.id,
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
