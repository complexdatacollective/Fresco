import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
import { cn } from '~/utils/shadcn';

/**
  * Renders a side panel, with a title and `props.children`.
  */

const Panel = ({
  title,
  children,
  highlight = null,
  noHighlight = false,
  noCollapse = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    if (noCollapse) { return; }
    setCollapsed((value) => !value);
  }, [setCollapsed, noCollapse]);

  return (
    <div className={cn(
      '[--base-node-size:calc(var(--nc-base-font-size)*6.6)]',
      'flex flex-col transition-all duration-500 grow shrink-0 basis-24 bg-[var(--nc-panel-bg-muted)] border-b-4 rounded-[var(--nc-border-radius)] overflow-hidden',
      `border-[var(${highlight})]`,
      noHighlight && 'border-none',
      collapsed && 'grow-0',
    )}>
      {title && (
        <div className={cn(
          "flex-col px-4 py-6 border-b-2 border-[var(--nc-background)] cursor-pointer flex items-center justify-center",
        )} onClick={toggleCollapsed}>
          <h3 className="panel__heading-header">{title}</h3>
        </div>
      )}
      <div className="flex flex-col shrink grow basis-auto overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

Panel.propTypes = {
  title: PropTypes.string,
  children: PropTypes.any,
  minimize: PropTypes.bool,
  highlight: PropTypes.string,
  noHighlight: PropTypes.bool,
  noCollapse: PropTypes.bool,
};

export default Panel;
