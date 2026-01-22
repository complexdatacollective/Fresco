'use client';

import { motion } from 'motion/react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect } from 'react';
import { containerClasses } from '~/components/ContainerClasses';
import { cx } from '~/utils/cva';
import ConnectUploadThing from '../_components/OnboardSteps/ConnectUploadThing';
import CreateAccount from '../_components/OnboardSteps/CreateAccount';
import Documentation from '../_components/OnboardSteps/Documentation';
import ManageParticipants from '../_components/OnboardSteps/ManageParticipants';
import UploadProtocol from '../_components/OnboardSteps/UploadProtocol';
import OnboardSteps from '../_components/Sidebar';
import type { SetupData } from './page';

export default function Setup({ setupData }: { setupData: SetupData }) {
  const [step, setStep] = useQueryState('step', parseAsInteger.withDefault(1));

  const steps = [
    {
      label: 'Create Account',
      component: CreateAccount,
    },
    {
      label: 'Connect UploadThing',
      component: ConnectUploadThing,
    },
    {
      label: 'Upload Protocol',
      component: UploadProtocol,
    },
    {
      label: 'Configure Participation',
      component: () => (
        <ManageParticipants
          allowAnonymousRecruitment={setupData.allowAnonymousRecruitment}
          limitInterviews={setupData.limitInterviews}
        />
      ),
    },
    {
      label: 'Documentation',
      component: Documentation,
    },
  ];

  const cardClasses = cx(
    containerClasses,
    'flex flex-row gap-6 bg-transparent p-0',
  );
  const mainClasses = cx('flex w-full rounded bg-white p-12');

  useEffect(() => {
    if (!setupData.hasAuth && step > 1) {
      void setStep(1);
      return;
    }

    if (setupData.hasAuth && step === 1) {
      void setStep(2);
      return;
    }

    if (setupData.hasAuth && step === 2 && setupData.hasUploadThingToken) {
      void setStep(3);
      return;
    }

    //  if we're past step 2 but we still have null values, go back to step 2
    if (setupData.hasAuth && step > 2) {
      if (
        !setupData.hasUploadThingToken ||
        setupData.allowAnonymousRecruitment === null ||
        setupData.limitInterviews === null
      ) {
        void setStep(2);
        return;
      }
    }
  }, [step, setStep, setupData]);

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
