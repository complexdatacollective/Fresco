import type { ReactNode } from 'react';
import '~/styles/themes/interview.css';

export default function InterviewLayout({ children }: { children: ReactNode }) {
  return (
    <main
      data-theme="interview"
      className="flex h-screen max-h-screen flex-col"
    >
      {children}
    </main>
  );
}
