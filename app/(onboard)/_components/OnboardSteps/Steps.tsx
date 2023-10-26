export type Step = {
  description: string;
  component: string;
};

export const steps: Step[] = [
  {
    description: 'Create Account',
    component: 'CreateAccount',
  },
  {
    description: 'Upload Protocol',
    component: 'UploadProtocol',
  },
  {
    description: 'Configure Participation',
    component: 'ManageParticipants',
  },
  {
    description: 'Documentation',
    component: 'Documentation',
  },
];
