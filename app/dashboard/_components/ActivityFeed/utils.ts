import { type ActivityType } from '~/components/DataTable/types';

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
    case 'API Token Created':
      return 'bg-cerulean-blue hover:bg-cerulean-blue-dark';
    case 'API Token Updated':
      return 'bg-kiwi hover:bg-kiwi-dark';
    case 'API Token Deleted':
      return 'bg-cyber-grape hover:bg-cyber-grape-dark';
    case 'Password Changed':
      return 'bg-mustard hover:bg-mustard-dark';
    case 'User Login':
      return 'bg-neon-coral hover:bg-neon-coral-dark';
    case 'User Created':
      return 'bg-sea-green hover:bg-sea-green-dark';
    case 'Preview Mode':
      return 'bg-tomato hover:bg-tomato-dark';
    case 'User Deleted':
      return 'bg-charcoal hover:bg-charcoal-dark';
    case 'Two-Factor Enabled':
      return 'bg-sea-green hover:bg-sea-green-dark';
    case 'Two-Factor Disabled':
      return 'bg-neon-carrot hover:bg-neon-carrot-dark';
    case 'Two-Factor Reset':
      return 'bg-mustard hover:bg-mustard-dark';
    case 'Two-Factor Login':
      return 'bg-neon-coral hover:bg-neon-coral-dark';
    case 'Recovery Code Used':
      return 'bg-purple-pizazz hover:bg-purple-pizazz-dark';
    case 'Recovery Codes Regenerated':
      return 'bg-cerulean-blue hover:bg-cerulean-blue-dark';
  }
};
