'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { containerClasses } from '../_components/schemas';
import dynamic from 'next/dynamic';
import { StepLoadingState } from '../_components/Helpers';
import { AnimatePresence, motion } from 'framer-motion';
import OnboardSteps from '../_components/Sidebar';
import { cn } from '~/utils/shadcn';
import { use, useEffect } from 'react';
import type { DataPromiseType } from './page';

// Stages are dynamically imported, and then conditionally rendered, so that
// we don't load all the code for all the stages at once.
const CreateAccount = dynamic(
  () => import('../_components/OnboardSteps/CreateAccount'),
  {
    loading: () => <StepLoadingState key="loading" />,
  },
);
const UploadProtocol = dynamic(
  () => import('../_components/OnboardSteps/UploadProtocol'),
  {
    loading: () => <StepLoadingState key="loading" />,
  },
);
const ManageParticipants = dynamic(
  () => import('../_components/OnboardSteps/ManageParticipants'),
  {
    loading: () => <StepLoadingState key="loading" />,
  },
);
const Documentation = dynamic(
  () => import('../_components/OnboardSteps/Documentation'),
  {
    loading: () => <StepLoadingState key="loading" />,
  },
);

const calculateStep = (
  currentStep: number,
  hasAuth: boolean,
  hasProtocol: boolean,
  hasParticipants: boolean,
  initialLoad = true,
) => {
  if (!hasAuth && currentStep > 1) return 1;

  // We allow the user to skip steps if this isn't the first load
  if (!initialLoad) {
    return currentStep;
  }

  if (!hasProtocol) return 2;
  if (!hasParticipants) return 3;
  return 4;
};

export default function Setup({
  dataPromise,
}: {
  dataPromise: DataPromiseType;
}) {
  const { hasAuth, hasProtocol, hasParticipants } = use(dataPromise);
  const [currentStep, setStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(
      calculateStep(1, hasAuth, hasProtocol, hasParticipants),
    ),
  );

  const cardClasses = cn(containerClasses, 'flex-row bg-transparent p-0 gap-6');
  const mainClasses = cn('bg-white flex w-full p-12 rounded-xl');

  useEffect(() => {
    const step = calculateStep(
      currentStep,
      hasAuth,
      hasProtocol,
      hasParticipants,
      false,
    );
    if (currentStep !== step) {
      void setStep(step);
    }
  }, [hasAuth, hasProtocol, hasParticipants, currentStep, setStep]);

  return (
    <motion.div className={cardClasses}>
      <OnboardSteps />
      <div className={mainClasses}>
        {currentStep === 1 && <CreateAccount key="step-1" />}
        {currentStep === 2 && <UploadProtocol key="step-2" />}
        {currentStep === 3 && <ManageParticipants key="step-3" />}
        {currentStep === 4 && <Documentation key="step-4" />}
      </div>
    </motion.div>
  );
}
