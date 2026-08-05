import { type Metadata } from 'next';

import { ThemedRegion } from '@codaco/fresco-ui/ThemedRegion';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemedRegion
      theme="interview"
      className="flex h-screen max-h-screen flex-col"
    >
      {children}
    </ThemedRegion>
  );
}

export default RootLayout;
