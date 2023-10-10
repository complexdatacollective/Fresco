import { faker } from '@faker-js/faker';
import { type Prisma } from '@prisma/client';
import stages from './stages.json' assert { type: 'json' };

const mockProtocol = (): Prisma.ProtocolUncheckedCreateInput => {
  return {
    name: faker.word.words(4),
    hash: faker.word.words(4),
    codebook: {},
    schemaVersion: faker.number.int({ min: 6, max: 8 }),
    description: faker.lorem.sentence(),
    lastModified: faker.date.past(),
    stages: stages,
  };
};

export default mockProtocol;
