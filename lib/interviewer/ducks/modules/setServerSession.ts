import type { Protocol } from '@codaco/shared-consts';
import type { ServerSession } from '~/app/(interview)/interview/[interviewId]/page';

export const SET_SERVER_SESSION = 'INIT/SET_SERVER_SESSION';

export type SetServerSessionAction = {
  type: typeof SET_SERVER_SESSION;
  payload: {
    protocol: Protocol;
    session: ServerSession;
  };
};
