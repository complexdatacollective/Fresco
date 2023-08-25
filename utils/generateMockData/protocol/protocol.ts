import { faker } from '@faker-js/faker';
import { type Prisma } from '@prisma/client';
import stages from './stages.json' assert { type: 'json' };

const mockProtocol = (): Prisma.ProtocolUncheckedCreateWithoutOwnerInput => {
  return {
    name: faker.word.words(4),
    hash: faker.word.words(4),
    schemaVersion: faker.number.int({ min: 6, max: 8 }),
    description: faker.lorem.sentence(),
    assetPath: 'assets/path',
    lastModified: faker.date.past(),
    stages: JSON.stringify(stages),
  };
};

export default mockProtocol;
