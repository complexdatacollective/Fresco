import { BadgeCheck } from 'lucide-react';

export default function InterviewCompleted() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[var(--nc-background)]">
      <BadgeCheck className="mb-4 h-12 w-12 text-[var(--color-sea-green)]" />
      <h1 className="text-3xl font-extrabold text-white">
        Thank you for participating!
      </h1>
      <p className="text-lg text-white">
        Your interview has been successfully completed.
      </p>
    </div>
  );
}
