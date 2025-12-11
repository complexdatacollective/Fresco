import { FileWarning } from 'lucide-react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';

export default function NotFound() {
  return (
    <div className="bg-surface-0 flex h-screen flex-col items-center justify-center">
      <FileWarning className="text-primary mb-4 h-12 w-12" />
      <Heading level="h1">404</Heading>
      <Paragraph intent="lead">Page not found.</Paragraph>
    </div>
  );
}
