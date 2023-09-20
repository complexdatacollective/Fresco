import type { ComponentType } from 'react';
import UploadProtocol from '~/app/(onboard)/_components/OnboardSteps/UploadProtocol';
import CreateAccount from '~/app/(onboard)/_components/OnboardSteps/CreateAccount';
import Documentation from '~/app/(onboard)/_components/OnboardSteps/Documentation';
import ManageParticipants from './ManageParticipants';

export interface Step {
  number: string;
  description: string;
  component: ComponentType;
}

export const steps: Step[] = [
  {
    number: '1',
    description: 'Create Account',
    component: CreateAccount,
  },
  {
    number: '2',
    description: 'Upload Protocol',
    component: UploadProtocol,
  },
  {
    number: '3',
    description: 'Configure Participation',
    component: ManageParticipants,
  },
  {
    number: '4',
    description: 'Documentation',
    component: Documentation,
  },
];
