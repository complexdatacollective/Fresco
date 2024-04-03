import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { AlertTriangle } from 'lucide-react';

export const SmallScreenOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[--nc-background] p-8 sm:hidden">
      <div className="bg-gray-100 flex h-screen flex-col items-center justify-center">
        <AlertTriangle className="text-violet-700 mb-4 h-12 w-12" />
        <Heading variant="h1">Screen Size Too Small</Heading>
        <Paragraph variant="lead">
          To view this content, please maximize the window or try again on a
          device with a larger screen.
        </Paragraph>
      </div>
    </div>
  );
};
export default SmallScreenOverlay;
