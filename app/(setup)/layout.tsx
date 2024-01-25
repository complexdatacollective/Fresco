import BackgroundBlobs from '~/components/BackgroundBlobs/BackgroundBlobs';
import Image from 'next/image';
import type { PropsWithChildren } from 'react';
import Link from 'next/link';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="relative z-10 flex h-[90dvh] w-[100dvw] flex-col">
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
        <main className="flex flex-grow items-center justify-center">
          {children}
        </main>
      </div>
      <div className="bg-navy-taupe text-background-primary absolute left-0 top-0 h-[100dvh] w-[100dvw]">
        <BackgroundBlobs large={0} medium={3} small={4} />
      </div>
    </>
  );
}
