import React, { useCallback, useState } from 'react';
import Surface, { surfaceSpacingVariants } from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { compose, cva, cx } from '~/utils/cva';

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  minimize?: boolean;
  panelNumber: number;
  noCollapse?: boolean;
};

/**
 * Renders a side panel, with a title and `props.children`.
 */

const Panel = ({
  title,
  children,
  minimize = false,
  panelNumber,
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
    minimize && 'mb-0 grow-0 basis-0 border-b-0 opacity-0',
    collapsed && !minimize && 'grow-0',
    panelNumber === 0 && 'border-b-cat-1',
    panelNumber === 1 && 'border-b-cat-2',
    panelNumber === 2 && 'border-b-cat-3',
    panelNumber === 3 && 'border-b-cat-4',
    panelNumber === 4 && 'border-b-cat-5',
    panelNumber === 5 && 'border-b-cat-6',
    panelNumber === 6 && 'border-b-cat-7',
    panelNumber === 7 && 'border-b-cat-8',
    panelNumber === 8 && 'border-b-cat-9',
    panelNumber === 9 && 'border-b-cat-10',
  );

  const panelContentClasses = compose(
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
      <div className={panelContentClasses()}>{children}</div>
    </Surface>
  );
};

export default Panel;
