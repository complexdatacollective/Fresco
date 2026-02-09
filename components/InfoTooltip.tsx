import { Popover as BasePopover } from '@base-ui/react/popover';
import { InfoIcon } from 'lucide-react';
import { type ComponentProps, type ReactElement } from 'react';
import Heading from './typography/Heading';
import Paragraph from './typography/Paragraph';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

type InfoTooltipProps = Omit<ComponentProps<typeof Popover>, 'children'> & {
  title: string;
  description:
    | string
    | ((props: ComponentProps<'p'>) => ReactElement)
    | ReactElement;
  trigger?: ReactElement;
  sideOffset?: number;
};

/**
 *
 * InfoTooltip component for displaying informational tooltips.
 *
 * NOTE: Do not be tempted to use the base-ui tooltip component for this. Base-ui
 * specifically says to only use tooltips for things that cause actions
 * separate from the trigger itself.
 */
export default function InfoTooltip({
  title,
  description,
  trigger = <InfoIcon className="inline-block h-4 w-4" />,
  sideOffset = 10,
  ...rest
}: InfoTooltipProps) {
  return (
    <Popover {...rest}>
      <PopoverTrigger openOnHover>{trigger}</PopoverTrigger>
      <PopoverContent sideOffset={sideOffset} className="max-w-sm">
        <BasePopover.Title
          render={<Heading level="h4" variant="all-caps" className="mt-0!" />}
        >
          {title}
        </BasePopover.Title>
        {typeof description === 'string' ? (
          <BasePopover.Description render={<Paragraph className="text-sm" />}>
            {description}
          </BasePopover.Description>
        ) : (
          <BasePopover.Description render={description} />
        )}
      </PopoverContent>
    </Popover>
  );
}
