import Image from 'next/image';
import Link from 'next/link';
import { type PropsWithChildren, Suspense } from 'react';

import BackgroundBlobs from '~/components/BackgroundBlobs/BackgroundBlobs';
import NetlifyBadge from '~/components/NetlifyBadge';
import { env } from '~/env';
import FrescoLocaleSwitcher from '~/i18n/FrescoLocaleSwitcher';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div
        data-testid="background-blobs"
        className="bg-navy-taupe text-background fixed inset-0 -z-10"
      >
        <Suspense>
          <BackgroundBlobs large={0} medium={3} small={4} />
        </Suspense>
      </div>

      <div className="relative z-10 grid min-h-dvh w-full grid-rows-[auto_1fr_auto]">
        <header className="phone-landscape:p-4 flex items-center justify-between gap-4 p-2">
          <Link href="/" className="min-w-0">
            <Image
              src="/images/NC-Type and Mark Wide Pos.svg"
              width={545.52}
              height={131.61}
              priority
              alt={brandName}
              className="h-auto w-xs max-w-full"
            />
          </Link>
          <FrescoLocaleSwitcher variant="default" color="default" size="md" />
        </header>
        <main className="flex min-w-0 items-center justify-center">
          {children}
        </main>
        {env.SANDBOX_MODE && <NetlifyBadge />}
      </div>
    </>
  );
}

// Stable brand/data display; not translated application copy.
const brandName = 'Network Canvas';
