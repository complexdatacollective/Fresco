import { BadgeCheck } from 'lucide-react';

export default function InterviewCompleted() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <BadgeCheck className="mb-4 h-12 w-12 text-violet-600" />
      <h1 className="text-3xl font-extrabold text-violet-700">
        Thank you for participating!
      </h1>
      <p className="text-lg text-gray-700">
        Your interview has been successfully completed.
      </p>
    </div>
  );
}
