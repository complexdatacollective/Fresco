import { ChevronDown, ChevronUp } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import CopyDebugInfoButton from './CopyDebugInfoButton';
import Heading from './typography/Heading';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

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
        <Heading level="h4" variant="all-caps">
          {showStackTrace ? 'Hide' : 'Show'} debug information
        </Heading>
        {showStackTrace ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="bg-background relative max-h-52 flex-1 overflow-y-auto rounded-lg px-6 py-3 text-sm [&_pre]:inline-block [&_pre]:whitespace-pre-wrap">
        {children}
        <CopyDebugInfoButton debugInfo={errorText} className="mt-4 p-0" />
      </CollapsibleContent>
    </Collapsible>
  );
};
