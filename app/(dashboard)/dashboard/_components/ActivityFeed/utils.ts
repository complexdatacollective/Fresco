import { faker } from '@faker-js/faker';
import {
  type Activity,
  type ActivityType,
  activityTypes,
} from '~/lib/data-table/types';

const generateMessageForActivityType = (type: ActivityType) => {
  switch (type) {
    case 'Protocol Installed':
      return `Protocol "${faker.word.words({ count: 4 })}" installed`;
    case 'Protocol Uninstalled':
      return `Protocol "${faker.word.words({ count: 4 })}" uninstalled`;
    case 'Participant(s) Added':
      return `Added ${faker.number.int({ min: 1, max: 10 })} participant(s)`;
    case 'Participant(s) Removed':
      return `Removed ${faker.number.int({ min: 1, max: 10 })} participant(s)`;
    case 'Interview Started':
      return `Participant "${faker.person.fullName()}" started an interview`;
    case 'Interview Completed':
      return `Participant "${faker.person.fullName()}" completed an interview`;
    case 'Interview(s) Deleted':
      return `Deleted ${faker.number.int({ min: 1, max: 10 })} interview(s)`;
    case 'Data Exported':
      return `Exported data for ${faker.number.int({
        min: 1,
        max: 10,
      })} participant(s)`;
  }
};

export const getBadgeColorsForActivityType = (type: ActivityType) => {
  switch (type) {
    case 'Protocol Installed':
      return 'bg-slate-blue hover:bg-slate-blue-dark';
    case 'Protocol Uninstalled':
      return 'bg-neon-carrot hover:bg-neon-carrot-dark';
    case 'Participant(s) Added':
      return 'bg-sea-green hover:bg-sea-green';
    case 'Participant(s) Removed':
      return 'bg-tomato hover:bg-tomato-dark';
    case 'Interview Started':
      return 'bg-sea-serpent hover:bg-sea-serpent-dark';
    case 'Interview Completed':
      return 'bg-purple-pizazz hover:bg-purple-pizazz-dark';
    case 'Interview(s) Deleted':
      return 'bg-paradise-pink hover:bg-paradise-pink-dark';
    case 'Data Exported':
      return 'bg-kiwi hover:bg-kiwi-dark';
  }
};

export const generateMockActivity = (): Activity => {
  const type = faker.helpers.arrayElement(activityTypes);
  return {
    id: faker.string.uuid(),
    timestamp: faker.date.recent(),
    type,
    message: generateMessageForActivityType(type)!,
  };
};
