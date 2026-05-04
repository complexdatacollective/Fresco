'use client';

import { Toggle } from '@base-ui/react';
import { Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { IconButton } from '@codaco/fresco-ui/Button';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import { MotionSurface } from '@codaco/fresco-ui/layout/Surface';
import { cx } from '@codaco/fresco-ui/utils/cva';

const STUB_SUGGESTIONS = [
  { id: 'stub-1', name: 'Stub Suggestion 1', place: 'Test City, Test State' },
  { id: 'stub-2', name: 'Stub Suggestion 2', place: 'Test City, Test State' },
  { id: 'stub-3', name: 'Stub Suggestion 3', place: 'Test City, Test State' },
] as const;

type Props = {
  className?: string;
};

export default function GeospatialStubSearch({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const reset = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const handleToggle = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        setIsOpen(true);
      } else {
        reset();
      }
    },
    [reset],
  );

  const handleQueryChange = useCallback((value: string | undefined) => {
    setQuery(value ?? '');
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const showSuggestions = query.trim().length > 0;

  return (
    <div className={cx('flex items-center gap-2', className)}>
      <Toggle
        pressed={isOpen}
        onPressedChange={handleToggle}
        render={
          <IconButton
            icon={<Search />}
            color={isOpen ? 'secondary' : 'dynamic'}
            aria-label={isOpen ? 'Close search' : 'Search location'}
            aria-expanded={isOpen}
            data-testid="geospatial-search-toggle"
            size="lg"
          />
        }
      />

      {isOpen && (
        <div className="relative">
          <MotionSurface
            noContainer
            spacing="none"
            elevation="high"
            className="bg-surface/80 w-sm rounded-xl backdrop-blur-md"
          >
            <InputField
              type="text"
              autoFocus
              placeholder="Search for a place..."
              value={query}
              onChange={handleQueryChange}
              data-testid="geospatial-search-input"
              role="combobox"
              aria-label="Search"
              aria-expanded={showSuggestions}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              suffixComponent={
                query ? (
                  <IconButton
                    icon={<X />}
                    variant="text"
                    size="sm"
                    onClick={handleClear}
                    aria-label="Clear search"
                    data-testid="geospatial-search-clear"
                    tabIndex={-1}
                  />
                ) : undefined
              }
            />
          </MotionSurface>

          {showSuggestions && (
            <MotionSurface
              noContainer
              spacing="none"
              level="popover"
              elevation="high"
              className="absolute left-0 mt-2 flex max-h-64 w-sm flex-col"
            >
              <div
                role="listbox"
                aria-label="Search suggestions"
                className="flex flex-col p-1"
              >
                {STUB_SUGGESTIONS.map((s) => (
                  <div
                    key={s.id}
                    role="option"
                    aria-selected="false"
                    tabIndex={0}
                    onClick={reset}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        reset();
                      }
                    }}
                    className="hover:bg-accent/10 flex cursor-pointer flex-col gap-0.5 px-3 py-2 transition-colors outline-none"
                  >
                    <span className="text-sm">{s.name}</span>
                    <span className="text-xs">{s.place}</span>
                  </div>
                ))}
              </div>
            </MotionSurface>
          )}
        </div>
      )}
    </div>
  );
}
