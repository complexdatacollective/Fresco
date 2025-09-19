import { BadgeCheck } from 'lucide-react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';

export const dynamic = 'force-dynamic';

export default function InterviewCompleted() {
  return (
    <div className="text-primary-contrast flex h-screen flex-col items-center justify-center bg-[var(--nc-background)]">
      <BadgeCheck className="mb-4 h-12 w-12 text-[var(--color-sea-green)]" />
      <Heading variant="h1">Thank you for participating!</Heading>
      <Paragraph>Your interview has been successfully completed.</Paragraph>
    </div>
  );
}
