import { BadgeCheck } from 'lucide-react';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

export const dynamic = 'force-dynamic';

export default function InterviewCompleted() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[var(--nc-background)] text-primary-foreground">
      <BadgeCheck className="mb-4 h-12 w-12 text-[var(--color-sea-green)]" />
      <Heading variant="h1">Thank you for participating!</Heading>
      <Paragraph>Your interview has been successfully completed.</Paragraph>
    </div>
  );
}
