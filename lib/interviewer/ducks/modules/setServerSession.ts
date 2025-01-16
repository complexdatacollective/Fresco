import { type getInterviewById } from '~/queries/interviews';
export const SET_SERVER_SESSION = 'INIT/SET_SERVER_SESSION';

type Payload = NonNullable<Awaited<ReturnType<typeof getInterviewById>>>;

export type ProtocolWithAssets = Omit<Payload['protocol'], 'id'>;

export type SetServerSessionAction = {
  type: typeof SET_SERVER_SESSION;
  payload: Payload;
};
