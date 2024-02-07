'use client';

import { ArrowLeftFromLine } from 'lucide-react';
import { Button } from '../ui/Button';
import { CloseButton } from '../ui/CloseButton';
import Banner from '../Banner/Banner';
import FeedbackButton from './FeedbackButton';
import { useState } from 'react';
import SignOutModal from './SignOutModal';
import { usePathname } from 'next/navigation';
import Paragraph from '../ui/typography/Paragraph';
import { cn } from '~/utils/shadcn';

const FeedbackBanner = () => {
  const [openSignOutModal, setOpenSignOutModal] = useState(false);
  const path = usePathname();

  const isDashboard = path.startsWith('/dashboard');

  const returnToDashboard = () => {
    // hard redirect to dashboard to avoid issues with stale styling from interviewer
    window.location.href = '/dashboard';
  };

  return (
    <Banner>
      <div
        className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath:
              'polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)',
          }}
        />
      </div>
      <div
        className="absolute left-[max(45rem,calc(50%+8rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath:
              'polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)',
          }}
        />
      </div>
      {!isDashboard && (
        <>
          <SignOutModal
            openSignOutModal={openSignOutModal}
            setOpenSignOutModal={setOpenSignOutModal}
          />
          <Button
            variant="ghost"
            size="sm"
            className="font-bold"
            onClick={returnToDashboard}
          >
            <ArrowLeftFromLine className="mr-2" size={16} strokeWidth={3} />
            Back to Dashboard
          </Button>
        </>
      )}
      <div
        className={cn(
          'flex flex-grow items-center gap-4 text-sm',
          isDashboard ? 'justify-center' : 'justify-end',
        )}
      >
        {isDashboard && (
          <Paragraph variant="noMargin" className="m-0 hidden sm:inline-flex">
            <strong className="hidden font-semibold lg:inline-flex">
              🤖 Fresco is Alpha software – &nbsp;
            </strong>
            We depend on your feedback and issue reports to improve
          </Paragraph>
        )}

        <FeedbackButton size="sm" variant="accent" />
        {!isDashboard && (
          <CloseButton onClick={() => setOpenSignOutModal(true)} />
        )}
      </div>
    </Banner>
  );
};

export default FeedbackBanner;
