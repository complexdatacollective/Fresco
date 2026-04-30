'use client';

import { Combobox } from '@base-ui/react/combobox';
import { Check, SearchIcon } from 'lucide-react';
import { useMemo } from 'react';
import { type FacetedFilterConfig } from '~/components/DataTable/filters/types';
import Button from '@codaco/fresco-ui/Button';
import { ScrollArea } from '@codaco/fresco-ui/ScrollArea';
import { type ComboboxOption } from '@codaco/fresco-ui/form/components/fields/Combobox/shared';
import InputField from '@codaco/fresco-ui/form/components/fields/InputField';
import { dropdownItemVariants } from '@codaco/fresco-ui/styles/controlVariants';
import { cx } from '@codaco/fresco-ui/utils/cva';

type FacetedFilterProps = {
  value: string[] | undefined;
  onChange: (value: string[] | undefined) => void;
  config: FacetedFilterConfig;
  data: unknown[];
};

export default function FacetedFilter({
  value,
  onChange,
  config,
  data,
}: FacetedFilterProps) {
  const resolvedOptions =
    typeof config.options === 'function'
      ? config.options(data)
      : config.options;

  const comboboxOptions: ComboboxOption[] = useMemo(
    () =>
      resolvedOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [resolvedOptions],
  );

  const selectedValues = useMemo(() => value ?? [], [value]);

  const selectedOptions = useMemo(
    () =>
      comboboxOptions.filter((opt) =>
        selectedValues.includes(String(opt.value)),
      ),
    [comboboxOptions, selectedValues],
  );

  const handleValueChange = (
    newValue: unknown[] | null,
    _event: Combobox.Root.ChangeEventDetails,
  ) => {
    if (newValue === null || newValue.length === 0) {
      onChange(undefined);
    } else {
      const typedValue = newValue as ComboboxOption[];
      onChange(typedValue.map((opt) => String(opt.value)));
    }
  };

  const handleSelectAll = () => {
    onChange(comboboxOptions.map((opt) => String(opt.value)));
  };

  const handleDeselectAll = () => {
    onChange(undefined);
  };

  return (
    <Combobox.Root
      multiple
      items={comboboxOptions}
      value={selectedOptions}
      onValueChange={handleValueChange}
      open
    >
      <div className="flex flex-col gap-3">
        <Combobox.Input
          placeholder="Search..."
          render={({ onChange, ...rest }) => {
            const inputFieldProps =
              rest as unknown as React.ComponentPropsWithRef<typeof InputField>;
            return (
              <InputField
                {...inputFieldProps}
                size="sm"
                prefixComponent={<SearchIcon />}
                className="w-full"
                nativeOnChange={onChange}
              />
            );
          }}
        />
        <Combobox.Empty className="text-center text-sm text-current/50 italic empty:hidden">
          No options found.
        </Combobox.Empty>
        <Combobox.List
          className="inset-surface max-h-64 overflow-hidden rounded-sm has-data-empty:hidden"
          render={<ScrollArea viewportClassName="px-2" fade={false} />}
        >
          {(option: ComboboxOption) => (
            <Combobox.Item
              key={option.value}
              value={option}
              disabled={option.disabled}
              className={dropdownItemVariants()}
            >
              <Combobox.ItemIndicator className="flex size-4 items-center justify-center">
                <Check className="size-[1em]" />
              </Combobox.ItemIndicator>
              <span
                className={cx(
                  'flex-1',
                  !selectedValues.includes(String(option.value)) && 'ml-4',
                )}
              >
                {option.label}
              </span>
            </Combobox.Item>
          )}
        </Combobox.List>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button size="sm" onClick={handleDeselectAll}>
            Deselect All
          </Button>
        </div>
      </div>
    </Combobox.Root>
  );
}
