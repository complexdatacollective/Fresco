'use client';

import { LogOut } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import FeedbackBanner from './FeedbackBanner';
import { usePathname } from 'next/navigation';
import { CloseButton } from '../ui/CloseButton';
import { useState } from 'react';
import SignOutModal from './SignOutModal';
import { useUser } from '@clerk/nextjs';

const BannerContent = () => {
  const { user } = useUser();
  const [openSignOutModal, setOpenSignOutModal] = useState(false);
  const pathname = usePathname();

  const returnToDashboard = () => {
    // hard redirect to dashboard to avoid issues with stale styling from interviewer
    window.location.href = '/dashboard';
  };

  if (user && pathname.startsWith('/interview/')) {
    return (
      <>
        <SignOutModal
          openSignOutModal={openSignOutModal}
          setOpenSignOutModal={setOpenSignOutModal}
        />
        <div className="flex w-full items-center justify-between px-4">
          <Button
            className="rounded-full"
            variant="default"
            color="primary"
            size="sm"
            onClick={returnToDashboard}
          >
            Return to Dashboard{' '}
            <LogOut className="ml-2" size={16} strokeWidth={3} />
          </Button>
          <FeedbackBanner />
          <CloseButton onClick={() => setOpenSignOutModal(true)} />
        </div>
      </>
    );
  }

  return <FeedbackBanner />;
};

export default BannerContent;
