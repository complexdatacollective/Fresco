import { BadgeCheck } from 'lucide-react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';

export default function InterviewCompleted() {
  return (
    <Surface className="flex h-screen flex-col items-center justify-center">
      <BadgeCheck className="text-sea-green mb-4 size-12" />
      <Heading level="h1">Thank you for participating!</Heading>
      <Paragraph>Your interview has been successfully completed.</Paragraph>
    </Surface>
  );
}
