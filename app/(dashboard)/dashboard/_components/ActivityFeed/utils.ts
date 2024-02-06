import { faker } from '@faker-js/faker';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

export const activityTypes = [
  'Protocol Installed',
  'Protocol Uninstalled',
  'Participant(s) Added',
  'Participant(s) Removed',
  'Interview started',
  'Interview completed',
  'Data Exported',
] as const;

export type ActivityType = (typeof activityTypes)[number];

export const ActivitySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.enum(activityTypes),
  message: z.string(),
});

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
    case 'Interview started':
      return `Participant "${faker.person.fullName()}" started an interview`;
    case 'Interview completed':
      return `Participant "${faker.person.fullName()}" completed an interview`;
    case 'Data Exported':
      return `Exported data for ${faker.number.int({
        min: 1,
        max: 10,
      })} participant(s)`;
  }
};

export const getBadgeColorsForActivityType = (type: string) => {
  switch (type) {
    case 'Protocol Installed':
      return 'bg-slate-blue hover:bg-slate-blue-dark';
    case 'Protocol Uninstalled':
      return 'bg-neon-carrot hover:neon-carrot-dark';
    case 'Participant(s) Added':
      return 'bg-sea-green hover:bg-sea-green';
    case 'Participant(s) Removed':
      return 'bg-tomato hover:bg-tomato-dark';
    case 'Interview started':
      return 'bg-sea-serpent hover:bg-sea-serpent-dark';
    case 'Interview completed':
      return 'bg-purple-pizazz hover:bg-purple-pizazz-dark';
    case 'Data Exported':
      return 'bg-kiwi hover:kiwi-dark';
  }
};

export const generateMockActivity = (): Activity => {
  const type = faker.helpers.arrayElement(activityTypes);
  return {
    id: faker.string.uuid(),
    timestamp: faker.date.recent(),
    type,
    message: generateMessageForActivityType(type),
  };
};

export type Activity = Prisma.EventsGetPayload<{
  select: {
    id: true;
    timestamp: true;
    type: true;
    message: true;
  };
}>;

type test = z.infer<typeof ActivitySchema>;

export type Result = {
  data: Activity[];
  pageCount: number;
};
