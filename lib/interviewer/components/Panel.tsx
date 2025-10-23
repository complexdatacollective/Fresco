import React, { useCallback, useState } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { cx } from '~/utils/cva';
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
    'flex flex-col grow shrink-0 basis-[5rem] border-b-[0.5rem] mb-4 overflow-hidden',
    'transition-all ease-in-out duration-500',
    'last:mb-0',
    highlight === null && 'border-b-0',
    minimize && 'border-b-0 basis-0 grow-0 mb-0 opacity-0',
    collapsed && !minimize && 'grow-0',
    highlight === '--primary' && 'border-b-sea-green',
    highlight === '--nc-primary-color-seq-1' &&
      'border-[var(--nc-primary-color-seq-1)]',
    highlight === '--nc-primary-color-seq-2' &&
      'border-[var(--nc-primary-color-seq-2)]',
    highlight === '--nc-primary-color-seq-3' &&
      'border-[var(--nc-primary-color-seq-3)]',
    highlight === '--nc-primary-color-seq-4' &&
      'border-[var(--nc-primary-color-seq-4)]',
  );

  const panelContentClasses = cx(
    'flex flex-col grow shrink-0 basis-auto overflow-hidden',
    collapsed && !minimize && 'h-0',
  );

  return (
    <Surface className={panelClasses} elevation="high" spacing="none">
      <div
        className="border-background flex shrink-0 grow-0 flex-col justify-center border-b-[3px] px-4 py-2 text-center"
        onClick={toggleCollapsed}
      >
        <Heading level="h3" margin="none">
          {title}
        </Heading>
      </div>
      <div className={panelContentClasses}>{children}</div>
    </Surface>
  );
};

export default Panel;
