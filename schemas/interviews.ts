import { type Participant, type Protocol } from '~/lib/db/generated/client';

export type DeleteInterviews = {
  id: string;
}[];

export type CreateInterview = {
  participantIdentifier?: Participant['identifier'];
  protocolId: Protocol['id'];
};
