'use client';

import { ArrowLeftFromLine } from 'lucide-react';
import { Button } from '../ui/Button';
import { CloseButton } from '../ui/CloseButton';
import Banner from '../Banner/Banner';
import FeedbackButton from './FeedbackButton';
import { useState } from 'react';
import SignOutModal from './SignOutModal';
import { usePathname } from 'next/navigation';

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
      <div className="flex flex-grow items-center justify-between text-foreground">
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
              Return to Dashboard
            </Button>
          </>
        )}
        <div className="flex flex-grow items-center justify-center gap-x-4">
          <p className="m-0 text-sm leading-6 text-gray-900">
            <strong className="font-semibold">
              🤖 Fresco is Alpha software
            </strong>
            <svg
              viewBox="0 0 2 2"
              className="mx-2 inline h-0.5 w-0.5 fill-current"
              aria-hidden="true"
            >
              <circle cx={1} cy={1} r={1} />
            </svg>
            We depend on your feedback and issue reports to improve!
          </p>
          <FeedbackButton />
        </div>
        {!isDashboard && (
          <CloseButton onClick={() => setOpenSignOutModal(true)} />
        )}
      </div>
    </Banner>
  );
};

export default FeedbackBanner;
