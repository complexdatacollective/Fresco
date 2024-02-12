'use client';

import { cn } from '~/utils/shadcn';
import { useRouter } from 'next/navigation';
import OnboardSteps from '../_components/Sidebar';
import { parseAsInteger, useQueryState } from 'nuqs';
import { containerClasses } from '../_components/schemas';
import React, { useEffect } from 'react';
import { api } from '~/trpc/client';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { OnboardingProvider } from '../_components/OnboardingProvider';
import { StepLoadingState } from '../_components/Helpers';
import { clientRevalidateTag } from '~/utils/clientRevalidate';

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

function Page() {
  const router = useRouter();

  const [currentStep] = useQueryState('step', parseAsInteger.withDefault(1));

  const { data } = api.appSettings.get.useQuery(undefined, {
    refetchInterval: 1000 * 10,
  });

  useEffect(() => {
    if (data?.expired) {
      clientRevalidateTag('appSettings.get')
        .then(() => router.refresh())
        // eslint-disable-next-line no-console
        .catch((e) => console.error(e));
    }
  }, [data, router]);

  const cardClasses = cn(containerClasses, 'flex-row bg-transparent p-0 gap-6');
  const mainClasses = cn('bg-white flex w-full p-12 rounded-xl');

  return (
    <motion.div className={cardClasses}>
      <OnboardingProvider>
        <OnboardSteps />
        <div className={mainClasses}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && <CreateAccount key="step-1" />}
            {currentStep === 2 && <UploadProtocol key="step-2" />}
            {currentStep === 3 && <ManageParticipants key="step-3" />}
            {currentStep === 4 && <Documentation key="step-4" />}
          </AnimatePresence>
        </div>
      </OnboardingProvider>
    </motion.div>
  );
}

export default Page;
