import Image from 'next/image';
import Link from 'next/link';
import { type PropsWithChildren, Suspense } from 'react';
import BackgroundBlobs from '~/components/BackgroundBlobs/BackgroundBlobs';
import NetlifyBadge from '~/components/NetlifyBadge';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="relative z-10 flex min-h-dvh w-dvw flex-col">
        <Link href="/">
          <Image
            src="/images/NC-Type and Mark Wide Pos.svg"
            width={545.52}
            height={131.61}
            priority
            alt="Network Canvas"
            className="h-auto w-md p-4"
          />
        </Link>
        <main className="tablet:items-center tablet:py-0 flex grow items-start justify-center overflow-y-auto py-4">
          {children}
        </main>
        <NetlifyBadge />
      </div>
      <div
        data-testid="background-blobs"
        className="text-background bg-navy-taupe fixed top-0 left-0 h-dvh w-dvw"
      >
        <Suspense>
          <BackgroundBlobs large={0} medium={3} small={4} />
        </Suspense>
      </div>
    </>
  );
}
