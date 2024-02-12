import { type ReactNode, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import Heading from './ui/typography/Heading';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CopyDebugInfoButton from './CopyDebugInfoButton';

export const ErrorDetails = ({
  errorText,
  children,
}: {
  errorText: string;
  children: ReactNode;
}) => {
  const [showStackTrace, setShowStackTrace] = useState(false);

  return (
    <Collapsible
      open={showStackTrace}
      onOpenChange={setShowStackTrace}
      className="flex flex-1 flex-col space-y-2"
    >
      <CollapsibleTrigger className="flex items-center">
        <Heading variant="h4-all-caps">
          {showStackTrace ? 'Hide' : 'Show'} debug information
        </Heading>
        {showStackTrace ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="relative max-h-52 flex-1 overflow-y-auto rounded-lg bg-background px-6 py-3 text-sm [&_pre]:inline-block [&_pre]:whitespace-pre-wrap">
        {children}
        <CopyDebugInfoButton debugInfo={errorText} className="mt-4 p-0" />
      </CollapsibleContent>
    </Collapsible>
  );
};
