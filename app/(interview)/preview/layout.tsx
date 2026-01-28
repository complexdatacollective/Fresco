import type { ReactNode } from 'react';
import SmallScreenOverlay from '../interview/_components/SmallScreenOverlay';

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SmallScreenOverlay />
      {children}
    </>
  );
}
