import { faker } from '@faker-js/faker';
import { Prisma } from '@prisma/client';

const mockTeam = (): Prisma.TeamUncheckedCreateWithoutStudiesInput => {
  return {
    name: faker.company.name(),
    description: faker.company.catchPhrase(),
    image: faker.image.url(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
};

export default mockTeam;
