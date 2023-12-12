'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionProvider';
import FeedbackBanner from './FeedbackBanner';
import { usePathname } from 'next/navigation';

const BannerContent = () => {
  const { session, signOut } = useSession();
  const pathname = usePathname();

  if (session && pathname.startsWith('/interview/')) {
    return (
      <div className="flex w-full items-center justify-between px-4">
        <p className="text-sm font-bold leading-6">
          You are currently logged in.
        </p>
        <FeedbackBanner />
        <div className="flex gap-x-4">
          <Link href="/dashboard">
            <Button variant="default" color="primary" size="sm">
              Return to Dashboard{' '}
              <LogOut className="ml-2" size={16} strokeWidth={3} />
            </Button>
          </Link>
          <Button variant="link" color="primary" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <FeedbackBanner />;
};

export default BannerContent;
