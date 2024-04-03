import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { AlertTriangle } from 'lucide-react';

export const SmallScreenOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[--nc-background] p-8 sm:hidden">
      <AlertTriangle className="mb-4 h-12 w-12" />
      <Heading variant="h1">Screen Size Too Small</Heading>
      <Paragraph variant="lead">
        To view this content, please maximize the window or try again on a
        device with a larger screen.
      </Paragraph>
    </div>
  );
};
export default SmallScreenOverlay;
