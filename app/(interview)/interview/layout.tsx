import type { ReactNode } from 'react';

export default function InterviewLayout({ children }: { children: ReactNode }) {
  return (
    <main data-theme="dark" className="flex h-screen max-h-screen flex-col">
      {children}
    </main>
  );
}
