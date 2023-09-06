import { faker } from '@faker-js/faker';

const mockParticipant = () => {
  return {
    identifier: faker.person.fullName(),
  };
};

export default mockParticipant;
