import cx from 'classnames';
import { isEqual } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useId, useMemo } from 'react';
import { useDndStore, type DndStore } from '~/lib/dnd';
import Search from '~/lib/ui/components/Fields/Search';
import { getCSSVariableAsNumber } from '~/lib/ui/utils/CSSVariables';
import { cn } from '~/utils/shadcn';
import Loading from '../components/Loading';
import Panel from '../components/Panel';
import useSearch from '../hooks/useSearch';
import useSort from '../hooks/useSort';
import { type Direction } from '../utils/createSorter';
import HyperList from './HyperList';
import DropOverlay from './Interfaces/NameGeneratorRoster/DropOverlay';
import { type UseItemElement } from './Interfaces/NameGeneratorRoster/useItems';

const SortButton = ({
  color,
  label,
  isActive,
  sortDirection,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color: string;
  isActive: boolean;
  sortDirection: Direction;
  label: string;
  disabled?: boolean;
}) => (
  <button
    {...rest}
    tabIndex={0}
    disabled={disabled}
    className={cn(
      'filter-button',
      isActive && 'filter-button--active',
      disabled && 'pointer-events-none cursor-not-allowed opacity-50',
    )}
    color={color}
  >
    {label}

    {isActive && (sortDirection === 'asc' ? ' \u25B2' : ' \u25BC')}
  </button>
);

const modes = {
  LARGE: 'LARGE',
  SMALL: 'SMALL',
};

const EmptyComponent = () => (
  <motion.div
    className="searchable-list__placeholder"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <h2>Nothing matched your search term.</h2>
  </motion.div>
);

type SearchableListProps = {
  accepts: ({ meta: { itemType } }: { meta: { itemType: string } }) => boolean;
  columns: number | ((width: number) => number);
  title: string;
  dynamicProperties?: Record<string, unknown>;
  excludeItems?: string[];
  itemComponent?: React.ComponentType<unknown>;
  dragComponent?: React.ComponentType<unknown>;
  items: UseItemElement[];
  placeholder?: React.ReactNode;
  itemType: string;
  onDrop: ({ meta: { _uid } }: { meta: { _uid: string } }) => void;
  dropNodeColor?: string;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * SearchableList
 *
 * This adds UI around the HyperList component which enables
 * sorting and searching.
 */
const SearchableList = memo(
  (props: SearchableListProps) => {
    const {
      accepts,
      title,
      dynamicProperties,
      excludeItems,
      itemComponent,
      dragComponent,
      items,
      placeholder = null,
      itemType,
      onDrop,
      dropNodeColor,
      disabled = false,
      loading = false,
    } = props;

    const id = useId();
    const [results, query, setQuery, isWaiting, hasQuery] = useSearch(items);

    const [
      sortedResults,
      sortByProperty,
      sortDirection,
      setSortByProperty,
      setSortType,
      setSortDirection,
      sortableProperties,
      reset,
    ] = useSort(results);

    // When the user types a query, override the sort to sort by relevance
    useEffect(() => {
      if (hasQuery && !(sortByProperty === 'relevance')) {
        setSortByProperty('relevance');
        setSortType('number');
        setSortDirection('desc');
        return;
      }

      // If there's no query and the sortByProperty is relevance, reset to default
      // sort order
      if (!hasQuery && sortByProperty === 'relevance') {
        reset();
      }
    }, [
      hasQuery,
      setSortByProperty,
      setSortType,
      setSortDirection,
      reset,
      sortByProperty,
    ]);

    const filteredResults = useMemo(() => {
      if (!excludeItems || !sortedResults) {
        return sortedResults;
      }
      return sortedResults.filter((item) => !excludeItems.includes(item.id));
    }, [sortedResults, excludeItems]);

    const handleChangeSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setQuery(value);
    };

    const mode = items.length > 100 ? modes.LARGE : modes.SMALL;

    const hyperListPlaceholder =
      placeholder ??
      (isWaiting ? (
        <motion.div
          className="searchable-list__placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Loading message="Searching..." small />
        </motion.div>
      ) : null);

    const showTooMany = mode === modes.LARGE && !hasQuery;
    const numberOfSortOptions = sortableProperties?.length ?? 0;
    const canSort = numberOfSortOptions > 0;

    const animationDuration =
      getCSSVariableAsNumber('--animation-duration-standard-ms') / 1000;

    const variants = {
      visible: { opacity: 1, transition: { duration: animationDuration } },
      hidden: { opacity: 0 },
    };

    const listClasses = cx(
      'searchable-list__list',
      { 'searchable-list__list--can-sort': canSort },
      { 'searchable-list__list--too-many': showTooMany },
    );

    // Monitor drop state from new DND store
    const isDragging = useDndStore((state: DndStore) => state.isDragging);
    const activeDropTargetId = useDndStore(
      (state: DndStore) => state.activeDropTargetId,
    );
    const dragItem = useDndStore((state: DndStore) => state.dragItem);

    const listId = `hyper-list-${id}`;
    const willAccept =
      isDragging &&
      dragItem?.metadata &&
      accepts({
        meta: {
          itemType: (dragItem.metadata as { itemType?: string }).itemType ?? '',
        },
      });
    const isOver = activeDropTargetId === listId;

    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        className="searchable-list"
      >
        <Panel title={title} noCollapse>
          {canSort && (
            <div className="searchable-list__sort">
              {hasQuery && (
                <div
                  className={`filter-button ${
                    isEqual(sortByProperty, 'relevance')
                      ? 'filter-button--active'
                      : ''
                  }`}
                  onClick={() => {
                    setSortByProperty('relevance');
                    setSortType('number');
                    setSortDirection('desc');
                  }}
                  role="button"
                  tabIndex={0}
                >
                  Relevance
                </div>
              )}
              {sortableProperties?.map(({ property, type, label }) => {
                const isActive = isEqual(property, sortByProperty);
                const color = isActive ? 'primary' : 'platinum';

                const handleSort = () => {
                  setSortByProperty(property);
                  setSortType(type);
                };

                return (
                  <SortButton
                    key={property.join('-')}
                    onClick={handleSort}
                    color={color}
                    label={label}
                    isActive={isActive}
                    sortDirection={sortDirection}
                    disabled={hasQuery}
                  />
                );
              })}
            </div>
          )}
          <div className={listClasses}>
            <AnimatePresence mode="wait">
              {loading ? (
                <Loading key="loading" message="Loading..." />
              ) : (
                <HyperList
                  id={`hyper-list-${id}`}
                  items={filteredResults}
                  dynamicProperties={dynamicProperties}
                  itemComponent={itemComponent!}
                  dragComponent={dragComponent}
                  emptyComponent={EmptyComponent}
                  placeholder={hyperListPlaceholder}
                  itemType={itemType} // drop type
                  accepts={undefined}
                  onDrop={onDrop}
                  showTooMany={showTooMany}
                  allowDragging={!disabled}
                />
              )}
            </AnimatePresence>
            {willAccept && (
              <DropOverlay
                isOver={isOver}
                nodeColor={dropNodeColor}
                message="Drop here to remove"
              />
            )}
          </div>
          <div className="searchable-list__search">
            <Search
              placeholder="Enter a search term..."
              input={{
                name: 'search',
                value: query,
                onChange: handleChangeSearch,
              }}
            />
          </div>
        </Panel>
      </motion.div>
    );
  },
  // Perform deep comparison of items to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Return true to skip render
    return (
      prevProps.loading === nextProps.loading &&
      isEqual(prevProps.items, nextProps.items) &&
      prevProps.title === nextProps.title &&
      prevProps.columns === nextProps.columns &&
      prevProps.excludeItems === nextProps.excludeItems &&
      prevProps.itemType === nextProps.itemType &&
      prevProps.dynamicProperties === nextProps.dynamicProperties &&
      prevProps.dropNodeColor === nextProps.dropNodeColor &&
      prevProps.disabled === nextProps.disabled
    );
  },
);

SearchableList.displayName = 'SearchableList';

export default SearchableList;
