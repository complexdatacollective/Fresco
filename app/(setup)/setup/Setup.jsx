"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { containerClasses } from '../_components/schemas';
import dynamic from "next/dynamic";
import { StepLoadingState } from '../_components/Helpers';
import { AnimatePresence, motion } from 'framer-motion';
import OnboardSteps from '../_components/Sidebar';
import { cn } from '~/utils/shadcn';


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

/**
 *
 * Restructured this way because of this: https://github.com/47ng/nuqs/issues/496#issuecomment-1938178091
 */
export default function Setup() {
  const [currentStep] = useQueryState('step', parseAsInteger.withDefault(1));

  const cardClasses = cn(containerClasses, 'flex-row bg-transparent p-0 gap-6');
  const mainClasses = cn('bg-white flex w-full p-12 rounded-xl');

  return (
    <motion.div className={cardClasses}>
      <OnboardSteps />
      <div className={mainClasses}>
        <AnimatePresence mode="wait">
          {currentStep === 1 && <CreateAccount key="step-1" />}
          {currentStep === 2 && <UploadProtocol key="step-2" />}
          {currentStep === 3 && <ManageParticipants key="step-3" />}
          {currentStep === 4 && <Documentation key="step-4" />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
