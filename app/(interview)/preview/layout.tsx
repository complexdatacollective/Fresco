import { type ReactNode, Suspense } from 'react';
import '~/styles/themes/interview.css';
import SmallScreenOverlay from '../interview/_components/SmallScreenOverlay';

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <main
      data-theme="interview"
      className="flex h-screen max-h-screen flex-col"
    >
      <Suspense fallback={null}>
        <SmallScreenOverlay />
      </Suspense>
      {children}
    </main>
  );
}
