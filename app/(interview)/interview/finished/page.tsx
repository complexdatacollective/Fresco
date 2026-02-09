import { BadgeCheck } from 'lucide-react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';

export default function InterviewCompleted() {
  return (
    <div className="text-primary-foreground flex h-screen flex-col items-center justify-center bg-(--nc-background)">
      <BadgeCheck className="text-sea-green mb-4 h-12 w-12" />
      <Heading variant="h1">Thank you for participating!</Heading>
      <Paragraph>Your interview has been successfully completed.</Paragraph>
    </div>
  );
}
