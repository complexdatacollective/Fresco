'use client';

import { Toggle } from '@base-ui/react';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import { IconButton } from '~/components/ui/Button';
import { Collection } from '~/lib/collection/components/Collection';
import { ListLayout } from '~/lib/collection/layout/ListLayout';
import { type ItemProps } from '~/lib/collection/types';
import InputField from '~/lib/form/components/fields/InputField';
import { cx } from '~/utils/cva';
import {
  useGeospatialSearch,
  type Suggestion,
  type UseGeospatialSearchProps,
} from './useGeospatialSearch';

// Wrapper type that extends Suggestion with the required Record constraint
type SuggestionItem = Suggestion & Record<string, unknown>;

// Motion variants extracted to avoid recreation on every render
const searchContainerVariants = {
  initial: { opacity: 0, y: '-100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '-100%' },
} as const;

// Prevent blur when clicking suggestions (fixes race condition)
const preventBlur = (e: React.MouseEvent) => e.preventDefault();

export default function GeospatialSearch({
  accessToken,
  map,
  proximity,
  resetKey,
  className,
}: UseGeospatialSearchProps & { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Stable ID for ARIA association between input and listbox
  const listboxId = useId();

  const {
    query,
    handleQueryChange,
    suggestions,
    isLoading,
    handleSelect,
    clear,
  } = useGeospatialSearch({ accessToken, map, proximity, resetKey });

  // Layout inside component with useMemo to avoid shared instance issues
  const layout = useMemo(() => new ListLayout<SuggestionItem>({ gap: 0 }), []);

  const resetField = useCallback(() => {
    setIsOpen(false);
    clear();
  }, [clear]);

  const handleToggle = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        setIsOpen(true);
      } else {
        resetField();
      }
    },
    [resetField],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Don't close if clicking the toggle button (let the toggle handle it)
      if (buttonRef.current?.contains(e.relatedTarget)) {
        return;
      }
      // Don't close if focus is moving within the search panel (input or suggestions)
      if (panelRef.current?.contains(e.relatedTarget)) {
        return;
      }
      resetField();
    },
    [resetField],
  );

  const handleClear = useCallback(() => {
    clear();
    inputRef.current?.focus();
  }, [clear]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetField();
        // Restore focus to toggle button
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
        // Move focus to the first suggestion
        e.preventDefault();
        const firstOption = panelRef.current?.querySelector('[role="option"]');
        if (firstOption instanceof HTMLElement) {
          firstOption.focus();
        }
      } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
        // Move focus to the last suggestion
        e.preventDefault();
        const options = panelRef.current?.querySelectorAll('[role="option"]');
        const lastOption = options?.[options.length - 1];
        if (lastOption instanceof HTMLElement) {
          lastOption.focus();
        }
      }
    },
    [resetField, suggestions.length],
  );

  // Memoized extractors following Collection patterns
  const keyExtractor = useCallback(
    (item: SuggestionItem) => item.mapbox_id,
    [],
  );

  const textValueExtractor = useCallback(
    (item: SuggestionItem) => item.name,
    [],
  );

  // Click handler factory - returns a handler for each suggestion
  const handleSuggestionClick = useCallback(
    (suggestion: SuggestionItem) => () => {
      void handleSelect(suggestion);
      resetField();
    },
    [handleSelect, resetField],
  );

  // KeyDown handler factory for suggestions
  const handleSuggestionKeyDown = useCallback(
    (item: SuggestionItem) => (e: React.KeyboardEvent) => {
      const clickHandler = handleSuggestionClick(item);

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clickHandler();
      } else if (e.key === 'Escape') {
        resetField();
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowUp') {
        // Check if this is the first option - if so, return to input
        const options = panelRef.current?.querySelectorAll('[role="option"]');
        const firstOption = options?.[0];
        if (e.currentTarget === firstOption) {
          e.preventDefault();
          inputRef.current?.focus();
        }
        // Otherwise let Collection handle navigation
      } else if (e.key === 'ArrowDown') {
        // Check if this is the last option - if so, cycle to input
        const options = panelRef.current?.querySelectorAll('[role="option"]');
        const lastOption = options?.[options.length - 1];
        if (e.currentTarget === lastOption) {
          e.preventDefault();
          inputRef.current?.focus();
        }
        // Otherwise let Collection handle navigation
      }
    },
    [handleSuggestionClick, resetField],
  );

  // Memoized renderItem following OneToManyDyadCensus pattern
  const renderItem = useCallback(
    (item: SuggestionItem, itemProps: ItemProps) => (
      <div
        {...itemProps}
        onMouseDown={preventBlur}
        onClick={handleSuggestionClick(item)}
        onKeyDown={handleSuggestionKeyDown(item)}
        className={cx(
          'flex cursor-pointer flex-col gap-0.5 px-3 py-2',
          'transition-colors outline-none',
          'hover:bg-accent/10 data-focused:bg-accent/10',
        )}
      >
        <span className="text-sm">{item.name}</span>
        {item.place_formatted && (
          <span className="text-xs">{item.place_formatted}</span>
        )}
      </div>
    ),
    [handleSuggestionClick, handleSuggestionKeyDown],
  );

  const showSuggestions = suggestions.length > 0 || isLoading;

  return (
    <motion.div
      className={cx('flex items-center gap-2', className)}
      variants={searchContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Toggle
        pressed={isOpen}
        onPressedChange={handleToggle}
        render={
          <IconButton
            ref={buttonRef}
            icon={<Search />}
            color={isOpen ? 'secondary' : 'dynamic'}
            aria-label={isOpen ? 'Close search' : 'Search location'}
            aria-expanded={isOpen}
            data-testid="geospatial-search-toggle"
            className="relative"
            size="lg"
          />
        }
      />

      {/* Search panel - appears to right of toggle */}
      <AnimatePresence>
        {isOpen && (
          <div ref={panelRef} className="relative" onBlur={handleBlur}>
            <MotionSurface
              noContainer
              spacing="none"
              elevation="high"
              className="bg-surface/80 w-sm rounded-xl backdrop-blur-md"
              initial={{ opacity: 0, x: '-2rem' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '-2rem' }}
            >
              <InputField
                ref={inputRef}
                type="text"
                autoFocus
                placeholder="Search for a place..."
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleInputKeyDown}
                // ARIA combobox attributes
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls={listboxId}
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
                      tabIndex={-1}
                    />
                  ) : undefined
                }
              />
            </MotionSurface>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && (
                <MotionSurface
                  noContainer
                  spacing="none"
                  level="popover"
                  elevation="high"
                  className="absolute left-0 mt-2 flex max-h-64 w-sm flex-col"
                  initial={{ opacity: 0, y: '-0.5rem' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: '-0.5rem' }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  {isLoading && suggestions.length === 0 ? (
                    <div className="p-4 text-center text-sm italic">
                      Searching...
                    </div>
                  ) : (
                    <Collection
                      id={listboxId}
                      items={suggestions as SuggestionItem[]}
                      layout={layout}
                      keyExtractor={keyExtractor}
                      textValueExtractor={textValueExtractor}
                      selectionMode="none"
                      animate={false}
                      aria-label="Search suggestions"
                      className="flex flex-col p-1"
                      renderItem={renderItem}
                    />
                  )}
                </MotionSurface>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
