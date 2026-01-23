import { ChevronDown, ChevronUp } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import Heading from './typography/Heading';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

export const ErrorDetails = ({ children }: { children: ReactNode }) => {
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
      <CollapsibleContent className="bg-background relative flex-1 rounded px-6 py-3 text-sm">
        <div className="font-monospace max-h-52 overflow-y-auto break-all whitespace-pre-wrap [&_pre]:inline-block [&_pre]:whitespace-pre-wrap">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
