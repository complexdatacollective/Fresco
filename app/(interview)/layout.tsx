import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen max-h-screen flex-col scheme-dark">
      {children}
    </div>
  );
}

export default RootLayout;
