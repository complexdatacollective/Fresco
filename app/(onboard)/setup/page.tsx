'use client';

import { cn } from '~/utils/shadcn';
import { useRouter } from 'next/navigation';
import OnboardSteps from '../_components/Sidebar';
import { parseAsInteger, useQueryState } from 'next-usequerystate';
import { userFormClasses } from '../_shared';
import { useSession } from '~/providers/SessionProvider';
import React, { useEffect } from 'react';
import { api } from '~/trpc/client';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { OnboardingProvider } from '../_components/OnboardingProvider';
import { StepLoadingState, StepMotionWrapper } from '../_components/Helpers';
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
  const { session, isLoading } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

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

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!session && currentStep !== 1) {
      void setCurrentStep(1);
      return;
    }

    if (session && currentStep === 1) {
      void setCurrentStep(2);
      return;
    }
  }, [isLoading, session, currentStep, setCurrentStep]);

  const cardClasses = cn(userFormClasses, 'flex-row bg-transparent p-0 gap-6');
  const mainClasses = cn('bg-white flex w-full p-12 rounded-xl');

  return (
    <motion.div className={cardClasses}>
      <OnboardingProvider>
        <OnboardSteps />
        <div className={mainClasses}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <StepMotionWrapper key="create">
                <CreateAccount />
              </StepMotionWrapper>
            )}
            {currentStep === 2 && (
              <StepMotionWrapper key="upload">
                <UploadProtocol />
              </StepMotionWrapper>
            )}
            {currentStep === 3 && (
              <StepMotionWrapper key="manage">
                <ManageParticipants />
              </StepMotionWrapper>
            )}
            {currentStep === 4 && (
              <StepMotionWrapper key="docs">
                <Documentation />
              </StepMotionWrapper>
            )}
          </AnimatePresence>
        </div>
      </OnboardingProvider>
    </motion.div>
  );
}

export default Page;
