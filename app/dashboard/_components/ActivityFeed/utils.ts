import { type ActivityType } from '~/lib/data-table/types';

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
