import { type ReactNode, Suspense } from 'react';
import SmallScreenOverlay from '../_components/SmallScreenOverlay';

export default function InterviewSessionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <SmallScreenOverlay />
      </Suspense>
      {children}
    </>
  );
}
