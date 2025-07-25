import React, { useCallback, useState } from 'react';
import { cn } from '~/utils/shadcn';
import { type HighlightColor } from '../containers/NodePanels';

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

  const panelClasses = cn(
    'panel',
    'flex flex-col grow shrink-0 basis-[5rem] bg-[var(--nc-panel-bg-muted)] border-b-[0.5rem] rounded-[var(--nc-border-radius)] mb-4 overflow-hidden',
    'transition-all easing-in-out duration-300',
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

  const panelContentClasses = cn(
    'flex flex-col grow shrink-0 basis-auto overflow-hidden',
    collapsed && !minimize && 'h-0',
  );

  return (
    <div className={panelClasses}>
      <div
        className="flex shrink-0 grow-0 basis-[5rem] flex-col justify-center border-b-[0.1rem] border-[var(--nc-background)] px-4 py-2 text-center"
        onClick={toggleCollapsed}
      >
        <h3 className="m-0">{title}</h3>
      </div>
      <div className={panelContentClasses}>{children}</div>
    </div>
  );
};

export default Panel;
