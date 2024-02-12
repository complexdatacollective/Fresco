import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { type ReactNode } from 'react';

export default function InfoTooltip({
  content,
  trigger = <InfoIcon className="mx-2 h-4 w-4" />,
  triggerClasses,
}: {
  content: ReactNode;
  trigger: ReactNode;
  triggerClasses?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className={triggerClasses}>{trigger}</TooltipTrigger>
        <TooltipContent className="max-w-72">{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
