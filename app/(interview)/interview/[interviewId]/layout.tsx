import type { ReactNode } from 'react';
import SmallScreenOverlay from '../_components/SmallScreenOverlay';

export default function InterviewSessionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <SmallScreenOverlay />
      {children}
    </>
  );
}
