'use client';

import { type BooleanFilterConfig } from '~/components/DataTable/filters/types';
import CheckboxGroupField from '~/components/ui/form/components/fields/CheckboxGroup';

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
  const options = [
    { value: 'true', label: config.trueLabel },
    { value: 'false', label: config.falseLabel },
  ];

  const selected: string[] = [];
  if (value === true) selected.push('true');
  if (value === false) selected.push('false');

  const handleChange = (values: (string | number)[] | undefined) => {
    const stringValues = (values ?? []).map(String);
    const hasTrue = stringValues.includes('true');
    const hasFalse = stringValues.includes('false');

    if (hasTrue && hasFalse) {
      // Both selected = no filter
      onChange(undefined);
    } else if (hasTrue) {
      onChange(true);
    } else if (hasFalse) {
      onChange(false);
    } else {
      onChange(undefined);
    }
  };

  return (
    <CheckboxGroupField
      name="boolean-filter"
      options={options}
      value={selected}
      onChange={handleChange}
      orientation="horizontal"
      size="sm"
    />
  );
}
