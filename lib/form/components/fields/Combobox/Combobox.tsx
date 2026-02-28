'use client';

import { Combobox } from '@base-ui/react/combobox';
import { Check, ChevronsUpDown, SearchIcon } from 'lucide-react';
import { useMemo, type ComponentPropsWithoutRef } from 'react';
import Button from '~/components/ui/Button';
import {
  type FieldValueProps,
  type InjectedFieldProps,
} from '~/lib/form/components/Field/types';
import { getInputState } from '~/lib/form/utils/getInputState';
import { cx, type VariantProps } from '~/utils/cva';
import InputField from '../InputField';
import {
  comboboxItemVariants,
  comboboxTriggerVariants,
  type ComboboxOption,
} from './shared';

type ComboboxFieldProps = FieldValueProps<(string | number)[]> &
  InjectedFieldProps & {
    options: ComboboxOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    showSearch?: boolean;
    showSelectAll?: boolean;
    showDeselectAll?: boolean;
    singular?: string;
    plural?: string;
    className?: string;
  } & Omit<
    ComponentPropsWithoutRef<typeof Combobox.Root>,
    | 'onValueChange'
    | 'multiple'
    | 'value'
    | 'defaultValue'
    | 'name'
    | 'disabled'
  > &
  VariantProps<typeof comboboxTriggerVariants>;

function ComboboxField(props: ComboboxFieldProps) {
  const {
    options,
    placeholder = 'Select items...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No items found.',
    showSearch = true,
    showSelectAll = true,
    showDeselectAll = true,
    singular = 'item',
    plural = 'items',
    size,
    className,
    onChange,
    value = [],
    name,
    disabled,
    readOnly,
    ...rest
  } = props;

  const handleValueChange = (
    newValue: unknown[] | null,
    _event: Combobox.Root.ChangeEventDetails,
  ) => {
    if (newValue === null) {
      onChange?.([]);
    } else {
      const typedValue = newValue as ComboboxOption[];
      onChange?.(typedValue.map((opt) => opt.value));
    }
  };

  const handleSelectAll = () => {
    const enabledOptions = options.filter((opt) => !opt.disabled);
    onChange?.(enabledOptions.map((opt) => opt.value));
  };

  const handleDeselectAll = () => {
    onChange?.([]);
  };

  // Convert value array to selected options
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  // Generate trigger label text
  const triggerLabel = useMemo(() => {
    if (value.length === 0) return null;
    if (value.length === options.length) {
      return `All ${plural} selected (${options.length})`;
    }
    if (value.length === 1) {
      return `1 ${singular} selected`;
    }
    return `${value.length} ${plural} selected`;
  }, [value, options.length, singular, plural]);

  const state = getInputState(props);

  // DISABLED FOR DEBUGGING: MutationObserver workaround
  // const observerRef = useRef<MutationObserver | null>(null);
  // const listCallbackRef = useCallback((node: HTMLDivElement | null) => {
  //   if (observerRef.current) {
  //     observerRef.current.disconnect();
  //     observerRef.current = null;
  //   }
  //   if (!node) return;
  //   const observer = new MutationObserver((mutations) => {
  //     for (const mutation of mutations) {
  //       if (
  //         mutation.type === 'attributes' &&
  //         mutation.attributeName === 'data-highlighted'
  //       ) {
  //         const target = mutation.target as HTMLElement;
  //         if (target.hasAttribute('data-highlighted')) {
  //           target.scrollIntoView({ block: 'nearest' });
  //         }
  //       }
  //     }
  //   });
  //   observer.observe(node, {
  //     attributes: true,
  //     attributeFilter: ['data-highlighted'],
  //     subtree: true,
  //   });
  //   observerRef.current = observer;
  // }, []);

  return (
    <Combobox.Root
      {...rest}
      multiple
      items={options}
      value={selectedOptions}
      onValueChange={handleValueChange}
      disabled={disabled ?? readOnly}
      name={name}
    >
      <Combobox.Trigger
        className={comboboxTriggerVariants({
          size,
          className: cx('w-full', className),
          state,
        })}
      >
        <span className="flex-1 truncate text-left">
          <Combobox.Value
            placeholder={
              <span className="text-input-contrast/50 italic">
                {placeholder}
              </span>
            }
          >
            {triggerLabel}
          </Combobox.Value>
        </span>
        <Combobox.Icon className="shrink-0">
          <ChevronsUpDown className="h-[1.2em] w-[1.2em]" />
        </Combobox.Icon>
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner className="z-50" align="start" sideOffset={10}>
          <Combobox.Popup
            className={cx(
              'max-h-96 rounded-sm shadow-lg',
              'bg-surface-popover text-surface-popover-contrast',
              'min-w-(--anchor-width)',
            )}
          >
            {showSearch && (
              <div className="flex items-center gap-2 p-2">
                <Combobox.Input
                  placeholder={searchPlaceholder}
                  render={
                    <InputField
                      size="sm"
                      type="search"
                      prefixComponent={<SearchIcon />}
                      layout={false}
                    />
                  }
                />
              </div>
            )}
            {(showSelectAll || showDeselectAll) && (
              <div className="border-surface-popover-contrast/10 border-b px-2 pb-2">
                <div className="flex gap-2">
                  {showSelectAll && (
                    <Button
                      onClick={handleSelectAll}
                      size="sm"
                      variant="link"
                      className="flex grow"
                    >
                      Select All
                    </Button>
                  )}
                  {showDeselectAll && (
                    <Button
                      onClick={handleDeselectAll}
                      size="sm"
                      variant="link"
                      className="flex grow"
                    >
                      Deselect All
                    </Button>
                  )}
                </div>
              </div>
            )}
            <Combobox.Empty>
              <div className="text-surface-popover-contrast/50 px-4 py-3 text-center text-sm italic">
                {emptyMessage}
              </div>
            </Combobox.Empty>
            <Combobox.List className="flex max-h-64 scroll-py-2 flex-col gap-1 overflow-y-auto overscroll-contain p-2">
              {(option: ComboboxOption) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  className={comboboxItemVariants({ size })}
                >
                  <Combobox.ItemIndicator className="flex size-4 items-center justify-center">
                    <Check className="h-[1em] w-[1em]" />
                  </Combobox.ItemIndicator>
                  <span
                    className={cx(
                      'flex-1',
                      !value.includes(option.value) && 'ml-4',
                    )}
                  >
                    {option.label}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export default ComboboxField;
