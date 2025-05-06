import { FileWarning } from 'lucide-react';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <FileWarning className="mb-4 h-12 w-12 text-violet-700" />
      <Heading variant="h1">404</Heading>
      <Paragraph variant="lead">Page not found.</Paragraph>
    </div>
  );
}
