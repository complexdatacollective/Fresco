import type { ReactNode } from 'react';
import '~/styles/interview.scss';
import '~/styles/themes/interview.css';

export default function InterviewLayout({ children }: { children: ReactNode }) {
  return (
    <main data-theme="dark" className="flex h-screen max-h-screen flex-col">
      {children}
    </main>
  );
}
