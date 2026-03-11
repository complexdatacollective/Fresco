import { type Metadata } from 'next';
import { InterviewThemeManager } from '~/components/InterviewThemeManager';
import '~/styles/themes/interview.css';

export const metadata: Metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InterviewThemeManager />
      <main className="flex h-screen max-h-screen flex-col scheme-dark">
        {children}
      </main>
    </>
  );
}

export default RootLayout;
