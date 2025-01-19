import { type getInterviewById } from '~/queries/interviews';

export const actionTypes = {
  setServerSession: 'INIT/SET_SERVER_SESSION' as const,
};

type Payload = NonNullable<Awaited<ReturnType<typeof getInterviewById>>>;

export type ProtocolWithAssets = Omit<Payload['protocol'], 'id'>;

export type SetServerSessionAction = {
  type: typeof actionTypes.setServerSession;
  payload: Payload;
};
