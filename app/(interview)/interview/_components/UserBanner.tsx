import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/ui/Button';
import { useSession } from '~/providers/SessionProvider';

export default function UserBanner() {
  const { session, signOut } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="relative isolate flex min-h-[70px] items-center overflow-hidden bg-gray-200 px-6 text-primary">
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
      <div className="flex w-full items-center justify-between">
        <p className="text-sm font-bold leading-6">
          You are currently logged in.
        </p>
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
    </div>
  );
}
