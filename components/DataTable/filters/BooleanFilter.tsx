'use client';

import { type BooleanFilterConfig } from '~/components/DataTable/filters/types';
import Button from '~/components/ui/Button';

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
      <Button
        size="sm"
        variant={value === true ? 'default' : 'outline'}
        color={value === true ? 'primary' : 'default'}
        onClick={() => handleClick(true)}
      >
        {config.trueLabel}
      </Button>
      <Button
        size="sm"
        variant={value === false ? 'default' : 'outline'}
        color={value === false ? 'primary' : 'default'}
        onClick={() => handleClick(false)}
      >
        {config.falseLabel}
      </Button>
    </div>
  );
}
