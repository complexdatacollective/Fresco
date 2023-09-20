import type { ComponentType } from 'react';
import UploadProtocol from '~/app/(onboard)/_components/OnboardSteps/UploadProtocol';
import CreateAccount from '~/app/(onboard)/_components/OnboardSteps/CreateAccount';
import Documentation from '~/app/(onboard)/_components/OnboardSteps/Documentation';
import ManageParticipants from './ManageParticipants';

export type Step = {
  description: string;
  component: ComponentType;
};

export const steps: Step[] = [
  {
    description: 'Create Account',
    component: CreateAccount,
  },
  {
    description: 'Upload Protocol',
    component: UploadProtocol,
  },
  {
    description: 'Configure Participation',
    component: ManageParticipants,
  },
  {
    description: 'Documentation',
    component: Documentation,
  },
];
