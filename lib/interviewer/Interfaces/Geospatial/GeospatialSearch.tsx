'use client';

import { Toggle } from '@base-ui/react';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import { IconButton } from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';
import { cx } from '~/utils/cva';
import {
  useGeospatialSearch,
  type Suggestion,
  type UseGeospatialSearchProps,
} from './useGeospatialSearch';

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

  const {
    query,
    handleQueryChange,
    suggestions,
    isLoading,
    handleSelect,
    clear,
  } = useGeospatialSearch({ accessToken, map, proximity, resetKey });

  const handleToggle = (pressed: boolean) => {
    if (pressed) {
      setIsOpen(true);
    } else {
      resetField();
    }
  };

  const resetField = () => {
    setIsOpen(false);
    clear();
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking the toggle button (let the toggle handle it)
    if (buttonRef.current?.contains(e.relatedTarget)) {
      return;
    }
    resetField();
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    void handleSelect(suggestion);
    resetField();
  };

  const handleClear = () => {
    clear();
    inputRef.current?.focus();
  };

  const showSuggestions = suggestions.length > 0 || isLoading;

  return (
    <motion.div
      className={cx('flex items-center gap-2', className)}
      variants={{
        initial: {
          opacity: 0,
          y: '-100%',
        },
        animate: {
          opacity: 1,
          y: 0,
        },
        exit: {
          opacity: 0,
          y: '-100%',
        },
      }}
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
            data-testid="geospatial-search-toggle"
            className="relative"
            size="lg"
          />
        }
      />

      {/* Search panel - appears to right of toggle */}
      <AnimatePresence>
        {isOpen && (
          <div className="relative">
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
                onBlur={handleBlur}
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
                  className="absolute left-0 mt-2 max-h-64 w-sm overflow-auto"
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
                    <ul role="listbox" className="p-1">
                      {suggestions.map((suggestion) => (
                        <li
                          key={suggestion.mapbox_id}
                          role="option"
                          aria-selected={false}
                          tabIndex={0}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionClick(suggestion)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSuggestionClick(suggestion);
                            }
                          }}
                          className={cx(
                            'flex cursor-pointer flex-col gap-0.5 px-3 py-2',
                            'transition-colors outline-none',
                            'hover:bg-accent/10 focus:bg-accent/10',
                          )}
                        >
                          <span className="text-sm">{suggestion.name}</span>
                          {suggestion.place_formatted && (
                            <span className="text-xs">
                              {suggestion.place_formatted}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
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
