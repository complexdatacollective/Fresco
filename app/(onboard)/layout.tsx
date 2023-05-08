import BackgroundBlobs from "~/ui/components/Art/BackgroundBlobs";
import Image from "next/image";
import type { PropsWithChildren } from "react";
import Link from "next/link";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="absolute left-10 top-5 z-50">
        <Link href="/">
          <Image
            src="/images/NC-Type and Mark Wide Pos_LRG@4x.png"
            width={300}
            height={84.05}
            alt="Network Canvas"
            priority
          />
        </Link>
      </div>
      <div className="absolute left-0 top-0 h-full w-full bg-violet-900">
        <BackgroundBlobs large={0} medium={3} small={4} />
      </div>
      <main className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
        {children}
      </main>
    </>
  );
}
