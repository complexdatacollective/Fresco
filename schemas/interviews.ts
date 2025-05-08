import { type Participant, type Protocol } from '@prisma/client';

export type DeleteInterviews = {
  id: string;
}[];

export interface CreateInterview {
  participantIdentifier?: Participant['identifier'];
  protocolId: Protocol['id'];
}
