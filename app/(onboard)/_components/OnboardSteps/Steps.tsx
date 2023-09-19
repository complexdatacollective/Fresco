import type { ComponentType } from 'react';
import ConfigureStudy from '~/app/(onboard)/_components/OnboardSteps/ConfigureStudy';
import CreateAccount from '~/app/(onboard)/_components/OnboardSteps/CreateAccount';
import Documentation from '~/app/(onboard)/_components/OnboardSteps/Documentation';

export interface Step {
  number: string;
  description: string;
  optional: boolean;
  component: ComponentType;
}

export const steps: Step[] = [
  {
    number: '1',
    description: 'Create Account',
    optional: false,
    component: CreateAccount,
  },
  {
    number: '2',
    description: 'Configure Study',
    optional: true,
    component: ConfigureStudy,
  },
  {
    number: '3',
    description: 'Documentation',
    optional: false,
    component: Documentation,
  },
];
