'use client';

import { motion } from 'framer-motion';
import { parseAsInteger, useQueryState } from 'nuqs';
import { use, useEffect } from 'react';
import { containerClasses } from '~/components/ContainerClasses';
import { cn } from '~/utils/shadcn';
import ConfigureEnvironment from '../_components/OnboardSteps/ConfigureEnvironment';
import CreateAccount from '../_components/OnboardSteps/CreateAccount';
import DeploymentSettings from '../_components/OnboardSteps/DeploymentSettings';
import Documentation from '../_components/OnboardSteps/Documentation';
import ManageParticipants from '../_components/OnboardSteps/ManageParticipants';
import UploadProtocol from '../_components/OnboardSteps/UploadProtocol';
import OnboardSteps from '../_components/Sidebar';
import type { SetupData } from './page';

export default function Setup({
  setupDataPromise,
}: {
  setupDataPromise: SetupData;
}) {
  const [step, setStep] = useQueryState('step', parseAsInteger.withDefault(1));

  const {
    hasAuth,
    allowAnonymousRecruitment,
    limitInterviews,
    disableAnalytics,
    hasUploadThingToken,
  } = use(setupDataPromise);

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

  return (
    <motion.div className={cardClasses}>
      <OnboardSteps />
      <div className={mainClasses}>
        {step === 1 && <CreateAccount />}
        {step === 2 && <ConfigureEnvironment />}
        {step === 3 && disableAnalytics !== null && (
          <DeploymentSettings disableAnalytics={disableAnalytics} />
        )}
        {step === 4 && <UploadProtocol />}
        {step === 5 &&
          allowAnonymousRecruitment !== null &&
          limitInterviews !== null && (
            <ManageParticipants
              allowAnonymousRecruitment={allowAnonymousRecruitment}
              limitInterviews={limitInterviews}
            />
          )}
        {step === 6 && <Documentation />}
      </div>
    </motion.div>
  );
}
