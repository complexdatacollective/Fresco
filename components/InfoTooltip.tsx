import { Popover } from '@base-ui-components/react/popover';
import { InfoIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { type ComponentProps, useState } from 'react';
import { MotionSurface } from './layout/Surface';
import Heading from './typography/Heading';
import Paragraph from './typography/Paragraph';

type InfoTooltipProps = ComponentProps<typeof Popover.Root> & {
  title: string;
  description: string | ComponentProps<typeof Popover.Description>['render'];
  trigger?: ComponentProps<typeof Popover.Trigger>['render'];
  sideOffset?: number;
};

/**
 *
 * InfoTooltip component for displaying informational tooltips.
 *
 * NOTE: Do not be tempted to use the tooltip component for this. Base-ui
 * specifically says to only use tooltips for things that cause actions
 * separate from the trigger itself.
 */
export default function InfoTooltip({
  title,
  description,
  trigger = (props) => (
    <InfoIcon className="mx-2 inline-block h-4 w-4" {...props} />
  ),
  ...rest
}: InfoTooltipProps) {
  const [mounted, setMounted] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setMounted(nextOpen);
  };

  return (
    <Popover.Root
      openOnHover
      {...rest}
      open={mounted}
      onOpenChange={handleOpenChange}
    >
      <Popover.Trigger render={trigger} />
      <Popover.Portal keepMounted>
        <AnimatePresence>
          {mounted && (
            <Popover.Positioner sideOffset={10}>
              <Popover.Popup
                render={
                  <MotionSurface
                    level={1}
                    elevation="none" // Can't use it because popovers span multiple backgrounds
                    spacing="sm"
                    className="max-w-64 text-sm shadow-xl"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                }
              >
                <Popover.Title
                  render={<Heading level="h4" variant="all-caps" />}
                >
                  {title}
                </Popover.Title>
                <Popover.Arrow className="data-[side=bottom]:top-[-15px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-14px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </Popover.Arrow>
                {typeof description === 'string' ? (
                  <Popover.Description
                    render={<Paragraph className="text-sm" />}
                  >
                    {description}
                  </Popover.Description>
                ) : (
                  <Popover.Description render={description} />
                )}
              </Popover.Popup>
            </Popover.Positioner>
          )}
        </AnimatePresence>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="30" height="20" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[var(--color-surface-1)]"
      />
    </svg>
  );
}
