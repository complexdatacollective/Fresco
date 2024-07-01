import { useCallback, useState, type ReactNode } from 'react';
import { cn } from '~/utils/shadcn';

/**
 * Renders a side panel, with a title and `props.children`.
 */

const Panel = ({
  title,
  children,
  highlight,
  noHighlight = false,
  noCollapse = false,
}: {
  title: string;
  children: ReactNode;
  highlight: string;
  noHighlight?: boolean;
  noCollapse?: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    if (noCollapse) {
      return;
    }
    setCollapsed((value) => !value);
  }, [setCollapsed, noCollapse]);

  return (
    <div
      style={{ '--nc-panel-border': `var(${highlight})` }}
      className={cn(
        '[--base-node-size:calc(var(--nc-base-font-size)*6.6)]',
        'flex shrink-0 grow basis-24 flex-col overflow-hidden rounded-[var(--nc-border-radius)] border-b-4 bg-[var(--nc-panel-bg-muted)] transition-all duration-500',
        'border-[var(--nc-panel-border)]',
        noHighlight && 'border-none',
        collapsed && 'grow-0',
      )}
    >
      {title && (
        <div
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center border-b-2 border-[var(--nc-background)] px-4 py-6 text-center',
          )}
          onClick={toggleCollapsed}
        >
          <h3 className="panel__heading-header">{title}</h3>
        </div>
      )}
      <div className="flex shrink grow basis-auto flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default Panel;
