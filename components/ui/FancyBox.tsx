import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '~/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cn } from '~/utils/shadcn';
import { selectTriggerStyles } from './select';
import { type ReactNode, useMemo, useRef, useState } from 'react';

const DefaultItemComponent = (item: {
  value: unknown;
  id: string;
  label: string;
}) => {
  return <div>{item.label}</div>;
};

export default function FancyBox<
  TItem extends { value: unknown; id: string; label: string },
>({
  items = [],
  ItemComponent = DefaultItemComponent,
  plural = 'items',
  singular = 'item',
  placeholder = 'Select Items...',
  className,
  showSearch = true,
  onValueChange,
  value,
}: {
  items: TItem[];
  ItemComponent?: (item: TItem) => ReactNode;
  placeholder?: string;
  plural?: string;
  singular?: string;
  className?: string;
  showSearch?: boolean;
  onValueChange: (value: TItem['id'][]) => void;
  value: TItem['id'][];
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [openCombobox, setOpenCombobox] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');

  const toggleItem = (itemId: TItem['id']) => {
    const newValue = value.includes(itemId)
      ? value.filter((id) => id !== itemId)
      : [...value, itemId];
    onValueChange(newValue);
    inputRef?.current?.focus();
  };

  const onComboboxOpenChange = (value: boolean) => {
    inputRef.current?.blur(); // HACK: otherwise, would scroll automatically to the bottom of page
    setOpenCombobox(value);
  };

  const triggerLabelText = useMemo(() => {
    if (value.length === 0) return placeholder;
    if (value.length === items.length)
      return `All ${plural} Selected (${items.length})`;

    if (value.length === 1) return `1 ${singular} Selected`;

    return `${value.length} ${plural} Selected`;
  }, [value, items, placeholder, plural, singular]);

  return (
    <>
      <Popover open={openCombobox} onOpenChange={onComboboxOpenChange}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-controls="frameworks"
            aria-expanded={openCombobox}
            className={cn(selectTriggerStyles, className)}
          >
            <span className="truncate">{triggerLabelText}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command loop>
            {showSearch && (
              <CommandInput
                name="Filter"
                ref={inputRef}
                placeholder={`Search ${plural}...`}
                value={inputValue}
                onValueChange={setInputValue}
                className="my-2 h-8"
              />
            )}
            <CommandGroup className="max-h-72 overflow-auto">
              <CommandItem
                onSelect={() => onValueChange(items.map((i) => i.id))}
              >
                Select All
              </CommandItem>
              <CommandItem onSelect={() => onValueChange([])}>
                Deselect All
              </CommandItem>
              <CommandSeparator />
              {items.map((item) => {
                const isActive = value.includes(item.id);
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => toggleItem(item.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <ItemComponent {...item} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
