import Image from 'next/image';
import Link from 'next/link';
import type { PropsWithChildren } from 'react';
import BackgroundBlobs from '~/components/BackgroundBlobs/BackgroundBlobs';
import NetlifyBadge from '~/components/NetlifyBadge';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="relative z-10 flex min-h-dvh w-dvw flex-col">
        <div className="p-6">
          <Link href="/">
            <Image
              src="/images/NC-Type and Mark Wide Pos_LRG@4x.png"
              width={300}
              height={84.05}
              priority
              alt="Network Canvas"
              style={{ width: 'auto', height: 'auto' }} // Needed to suppress console warning: https://github.com/vercel/next.js/issues/40762#issuecomment-1443868704
            />
          </Link>
        </div>
        <main className="flex grow items-center justify-center">
          {children}
        </main>
        <NetlifyBadge />
      </div>
      <div className="text-background-primary bg-navy-taupe fixed top-0 left-0 h-[100dvh] w-[100dvw]">
        <BackgroundBlobs large={0} medium={3} small={4} />
      </div>
    </>
  );
}
