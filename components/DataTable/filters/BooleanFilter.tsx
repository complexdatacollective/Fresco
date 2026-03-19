'use client';

import { cx } from '~/utils/cva';
import { type BooleanFilterConfig } from '~/components/DataTable/filters/types';

type BooleanFilterProps = {
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  config: BooleanFilterConfig;
};

export default function BooleanFilter({
  value,
  onChange,
  config,
}: BooleanFilterProps) {
  const handleClick = (selected: boolean) => {
    onChange(value === selected ? undefined : selected);
  };

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => handleClick(true)}
        className={cx(
          'rounded-md px-3 py-1.5 text-sm transition-colors',
          value === true
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-text/60 hover:bg-surface-1',
        )}
      >
        {config.trueLabel}
      </button>
      <button
        type="button"
        onClick={() => handleClick(false)}
        className={cx(
          'rounded-md px-3 py-1.5 text-sm transition-colors',
          value === false
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-text/60 hover:bg-surface-1',
        )}
      >
        {config.falseLabel}
      </button>
    </div>
  );
}
