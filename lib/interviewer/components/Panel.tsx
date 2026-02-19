import React, { useCallback, useState } from 'react';
import Surface, { surfaceSpacingVariants } from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { compose, cva, cx } from '~/utils/cva';
import { type HighlightColor } from '../Interfaces/NameGenerator/components/NodePanels';

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  minimize?: boolean;
  highlight?: HighlightColor | null;
  noCollapse?: boolean;
};

/**
 * Renders a side panel, with a title and `props.children`.
 */

const Panel = ({
  title,
  children,
  minimize = false,
  highlight = null,
  noCollapse = false,
}: PanelProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    if (noCollapse) {
      return;
    }
    setCollapsed((value) => !value);
  }, [setCollapsed, noCollapse]);

  const panelClasses = cx(
    'flex min-h-0 grow flex-col overflow-hidden rounded border-b-10',
    'transition-all duration-500 ease-in-out',
    highlight === null && 'border-b-0',
    minimize && 'mb-0 grow-0 basis-0 border-b-0 opacity-0',
    collapsed && !minimize && 'grow-0',
    highlight === '--primary' && 'border-b-sea-green',
    highlight === '--nc-primary-color-seq-1' &&
      'border-(--nc-primary-color-seq-1)',
    highlight === '--nc-primary-color-seq-2' &&
      'border-(--nc-primary-color-seq-2)',
    highlight === '--nc-primary-color-seq-3' &&
      'border-(--nc-primary-color-seq-3)',
    highlight === '--nc-primary-color-seq-4' &&
      'border-(--nc-primary-color-seq-4)',
  );

  const panelContentClasses = compose(
    surfaceSpacingVariants,
    cva({
      base: cx(
        'flex min-h-0 grow basis-auto flex-col overflow-hidden',
        collapsed && !minimize && 'h-0',
      ),
    }),
  );

  const headingClassNames = compose(
    surfaceSpacingVariants,
    cva({
      base: 'border-background flex shrink-0 grow-0 flex-col justify-center border-b-[3px] text-center',
    }),
  );

  return (
    <Surface
      className={panelClasses}
      elevation="high"
      spacing="none"
      noContainer
    >
      <div
        className={headingClassNames({ spacing: 'sm' })}
        onClick={toggleCollapsed}
      >
        <Heading level="h3" margin="none">
          {title}
        </Heading>
      </div>
      <div className={panelContentClasses({ spacing: 'xs' })}>{children}</div>
    </Surface>
  );
};

export default Panel;
