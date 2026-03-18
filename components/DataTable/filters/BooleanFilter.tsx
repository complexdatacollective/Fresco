'use client';

import { type BooleanFilterConfig } from '~/components/DataTable/filters/types';
import { cn } from '~/utils/shadcn';

type BooleanFilterProps = {
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  config: BooleanFilterConfig;
};

export function BooleanFilter({ value, onChange, config }: BooleanFilterProps) {
  const handleClick = (selected: boolean) => {
    onChange(value === selected ? undefined : selected);
  };

  return (
    <div className="flex rounded-lg border">
      <button
        type="button"
        className={cn(
          'flex-1 rounded-l-lg px-4 py-2 text-sm transition-colors',
          value === true
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted',
        )}
        onClick={() => handleClick(true)}
      >
        {config.trueLabel}
      </button>
      <button
        type="button"
        className={cn(
          'flex-1 rounded-r-lg px-4 py-2 text-sm transition-colors',
          value === false
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted',
        )}
        onClick={() => handleClick(false)}
      >
        {config.falseLabel}
      </button>
    </div>
  );
}
