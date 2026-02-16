import Image from 'next/image';
import Link from 'next/link';
import { type PropsWithChildren, Suspense } from 'react';
import BackgroundBlobs from '~/components/BackgroundBlobs/BackgroundBlobs';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import { env } from '~/env';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="relative z-10 flex min-h-dvh w-dvw flex-col">
        <Link href="/">
          <Image
            src="/images/NC-Type and Mark Wide Pos_LRG-4x.png"
            width={300}
            height={84.05}
            priority
            alt="Network Canvas"
            className="h-auto w-[300px] p-4"
          />
        </Link>
        <main className="tablet:items-center tablet:py-0 flex grow items-start justify-center overflow-y-auto py-4">
          {children}
        </main>
        {env.SANDBOX_MODE && (
          <ResponsiveContainer>
            <footer className="z-1 flex justify-center py-4">
              <a href="https://www.netlify.com">
                <img
                  src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg"
                  alt="Deploys by Netlify"
                />
              </a>
            </footer>
          </ResponsiveContainer>
        )}
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
