import { type ReactNode, Suspense } from 'react';
import SmallScreenOverlay from '../interview/_components/SmallScreenOverlay';

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <SmallScreenOverlay />
      </Suspense>
      {children}
    </>
  );
}
