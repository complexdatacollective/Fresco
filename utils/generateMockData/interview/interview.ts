import { faker } from '@faker-js/faker';
import { type Prisma } from '@prisma/client';
import network from './network.json' with { type: 'json' };

type InterviewUncheckedCreateWithoutProtocolAndUserInput = Omit<
  Prisma.InterviewUncheckedCreateWithoutProtocolInput,
  'participantId'
>;

const mockInterview =
  (): InterviewUncheckedCreateWithoutProtocolAndUserInput => {
    return {
      startTime: faker.date.recent(),
      finishTime: faker.date.recent(),
      network: JSON.stringify(network),
      currentStep: faker.number.int({ min: 0, max: 10 }),
    };
  };

export default mockInterview;
