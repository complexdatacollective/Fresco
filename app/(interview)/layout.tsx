import { type Metadata } from 'next';
import '~/styles/themes/interview.css';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      data-interview
      className="flex h-screen max-h-screen flex-col scheme-dark"
    >
      {children}
    </main>
  );
}

export default RootLayout;
