import { BadgeCheck } from 'lucide-react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';

export default function InterviewCompleted() {
  return (
    <div className="text-primary-contrast flex h-screen flex-col items-center justify-center bg-(--nc-background)">
      <BadgeCheck className="text-sea-green mb-4 size-12" />
      <Heading level="h1">Thank you for participating!</Heading>
      <Paragraph>Your interview has been successfully completed.</Paragraph>
    </div>
  );
}
