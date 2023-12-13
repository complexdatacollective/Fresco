'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionProvider';
import FeedbackBanner from './FeedbackBanner';
import { usePathname } from 'next/navigation';
import { CloseButton } from '../ui/CloseButton';
import { useState } from 'react';
import SignOutModal from './SignOutModal';

const BannerContent = () => {
  const { session } = useSession();
  const [openSignOutModal, setOpenSignOutModal] = useState(false);
  const pathname = usePathname();

  if (session && pathname.startsWith('/interview/')) {
    return (
      <>
        <SignOutModal
          openSignOutModal={openSignOutModal}
          setOpenSignOutModal={setOpenSignOutModal}
        />
        <div className="flex w-full items-center justify-between px-4">
          <Link href="/dashboard">
            <Button
              className="rounded-full"
              variant="default"
              color="primary"
              size="sm"
            >
              Return to Dashboard{' '}
              <LogOut className="ml-2" size={16} strokeWidth={3} />
            </Button>
          </Link>
          <FeedbackBanner />
          <CloseButton onClick={() => setOpenSignOutModal(true)} />
        </div>
      </>
    );
  }

  return <FeedbackBanner />;
};

export default BannerContent;
