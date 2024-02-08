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
  switch (type.toLowerCase()) {
    case 'protocol installed':
      return 'bg-slate-blue hover:bg-slate-blue-dark';
    case 'protocol uninstalled':
      return 'bg-neon-carrot hover:bg-neon-carrot-dark';
    case 'participant(s) added':
      return 'bg-sea-green hover:bg-sea-green';
    case 'participant(s) removed':
      return 'bg-tomato hover:bg-tomato-dark';
    case 'interview started':
      return 'bg-sea-serpent hover:bg-sea-serpent-dark';
    case 'interview completed':
      return 'bg-purple-pizazz hover:bg-purple-pizazz-dark';
    case 'interview(s) deleted':
      return 'bg-paradise-pink hover:bg-paradise-pink-dark';
    case 'data exported':
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
