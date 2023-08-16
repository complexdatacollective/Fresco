import { faker } from '@faker-js/faker';
import { type Prisma } from '@prisma/client';

const mockParticipant = (): Prisma.UserCreateInput => {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  };
};

export default mockParticipant;
