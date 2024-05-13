'use client';

import { containerClasses } from '../_components/schemas';
import OnboardSteps from '../_components/Sidebar';
import { cn } from '~/utils/shadcn';
import { motion } from 'framer-motion';
import type { SetupData } from './page';
import { use, useEffect } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';
import CreateAccount from '../_components/OnboardSteps/CreateAccount';
import UploadProtocol from '../_components/OnboardSteps/UploadProtocol';
import ManageParticipants from '../_components/OnboardSteps/ManageParticipants';
import Documentation from '../_components/OnboardSteps/Documentation';

export default function Setup({
  setupDataPromise,
}: {
  setupDataPromise: SetupData;
}) {
  const [step, setStep] = useQueryState('step', parseAsInteger.withDefault(1));

  const { hasAuth, allowAnonymousRecruitment, limitInterviews } =
    use(setupDataPromise);

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
  }, [hasAuth, step, setStep]);

  return (
    <motion.div className={cardClasses}>
      <OnboardSteps />
      <div className={mainClasses}>
        {step === 1 && <CreateAccount />}
        {step === 2 && <UploadProtocol />}
        {step === 3 && (
          <ManageParticipants
            allowAnonymousRecruitment={allowAnonymousRecruitment}
            limitInterviews={limitInterviews}
          />
        )}
        {step === 4 && <Documentation />}
      </div>
    </motion.div>
  );
}
