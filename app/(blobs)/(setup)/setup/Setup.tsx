'use client';

import { motion } from 'framer-motion';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect } from 'react';
import { containerClasses } from '~/components/ContainerClasses';
import { cn } from '~/utils/shadcn';
import ConnectUploadThing from '../_components/OnboardSteps/ConnectUploadThing';
import CreateAccount from '../_components/OnboardSteps/CreateAccount';
import Documentation from '../_components/OnboardSteps/Documentation';
import ManageParticipants from '../_components/OnboardSteps/ManageParticipants';
import UploadProtocol from '../_components/OnboardSteps/UploadProtocol';
import OnboardSteps from '../_components/Sidebar';
import type { SetupData } from './page';

export type OnboardStep = {
  label: string;
  component: () => JSX.Element;
};

export default function Setup({ setupData }: { setupData: SetupData }) {
  const [step, setStep] = useQueryState('step', parseAsInteger.withDefault(1));

  const {
    hasAuth,
    allowAnonymousRecruitment,
    limitInterviews,
    disableAnalytics,
    hasUploadThingToken,
  } = setupData;

  const steps = [
    {
      label: 'Create Account',
      component: CreateAccount,
      // skip: async () => !!(await getServerSession()),
    },
    {
      label: 'Connect UploadThing',
      component: ConnectUploadThing,
      // skip: async () => !!(await getAppSetting('uploadThingToken')),
    },
    {
      label: 'Upload Protocol',
      component: UploadProtocol,
      // skip: async () => (await prisma.protocol.count()) > 0,
    },
    {
      label: 'Configure Participation',
      component: () => (
        <ManageParticipants
          allowAnonymousRecruitment={allowAnonymousRecruitment}
          limitInterviews={limitInterviews}
        />
      ),
      // skip: async () => (await prisma.participant.count()) > 0,
    },
    {
      label: 'Documentation',
      component: Documentation,
    },
  ];

  const cardClasses = cn(containerClasses, 'flex-row bg-transparent p-0 gap-6');
  const mainClasses = cn('bg-white flex w-full p-12 rounded-xl');

  useEffect(() => {
    if (!hasAuth && step > 1) {
      void setStep(1);
      return;
    }

    if (hasAuth && step === 1) {
      void setStep(2);
      return;
    }

    if (hasAuth && step === 2 && hasUploadThingToken) {
      void setStep(3);
      return;
    }

    //  if we're past step 2 but we still have null values, go back to step 2
    if (hasAuth && step > 2) {
      if (
        !hasUploadThingToken ||
        disableAnalytics === null ||
        allowAnonymousRecruitment === null ||
        limitInterviews === null
      ) {
        void setStep(2);
        return;
      }
    }
  }, [
    hasAuth,
    step,
    setStep,
    hasUploadThingToken,
    disableAnalytics,
    allowAnonymousRecruitment,
    limitInterviews,
  ]);

  const StepComponent = steps[step - 1]!.component;

  return (
    <motion.div className={cardClasses}>
      <OnboardSteps steps={steps.map((step) => step.label)} />
      <div className={mainClasses}>
        <StepComponent />
      </div>
    </motion.div>
  );
}
