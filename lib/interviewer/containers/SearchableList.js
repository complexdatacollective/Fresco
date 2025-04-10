import cx from 'classnames';
import { isEqual } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import Search from '~/lib/ui/components/Fields/Search';
import { getCSSVariableAsNumber } from '~/lib/ui/utils/CSSVariables';
import useDropMonitor from '../behaviours/DragAndDrop/useDropMonitor';
import Loading from '../components/Loading';
import Panel from '../components/Panel';
import useSearch from '../hooks/useSearch';
import useSort from '../hooks/useSort';
import HyperList from './HyperList';
import DropOverlay from './Interfaces/NameGeneratorRoster/DropOverlay';

const SortButton = ({
  handleClick,
  variable,
  color,
  label,
  isActive,
  sortDirection,
}) => (
  <div
    tabIndex={0}
    role="button"
    className={`filter-button ${isActive ? 'filter-button--active' : ''}`}
    onClick={handleClick}
    key={variable}
    color={color}
  >
    {label}

    {isActive && (sortDirection === 'asc' ? ' \u25B2' : ' \u25BC')}
  </div>
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

/**
 * SearchableList
 *
 * This adds UI around the HyperList component which enables
 * sorting and searching.
 */

const SearchableList = (props) => {
  const {
    accepts,
    columns,
    title,
    dynamicProperties,
    excludeItems,
    itemComponent = null,
    dragComponent = null,
    items = [],
    placeholder = null,
    itemType,
    onDrop,
    searchOptions,
    sortOptions = {},
    dropNodeColor,
    disabled = false,
    loading = false,
  } = props;

  const { initialSortOrder = {} } = sortOptions;

  const id = useRef(uuid());
  const [results, query, setQuery, isWaiting, hasQuery] = useSearch(
    items,
    searchOptions,
  );

  const [
    sortedResults,
    sortByProperty,
    sortDirection,
    setSortByProperty,
    setSortType,
    setSortDirection,
  ] = useSort(results, initialSortOrder);

  useEffect(() => {
    if (hasQuery) {
      setSortByProperty(['relevance']);
      setSortType('number');
      setSortDirection('desc');
      return;
    }

    setSortByProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasQuery, setSortDirection, setSortType]);

  const filteredResults = useMemo(() => {
    if (!excludeItems || !sortedResults) {
      return sortedResults;
    }
    return sortedResults.filter((item) => !excludeItems.includes(item.id));
  }, [sortedResults, excludeItems]);

  const handleChangeSearch = (eventOrValue) => {
    const value = get(eventOrValue, ['target', 'value'], eventOrValue);
    setQuery(value);
  };

  const mode = items.length > 100 ? modes.LARGE : modes.SMALL;

  const hyperListPlaceholder =
    placeholder ||
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
  const numberOfSortOptions = get(sortOptions, 'sortableProperties', []).length;
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

  const { willAccept, isOver } = useDropMonitor(`hyper-list-${id.current}`) || {
    willAccept: false,
    isOver: false,
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className="searchable-list"
    >
      <Panel title={title} noHighlight noCollapse>
        {canSort && (
          <div className="searchable-list__sort">
            {hasQuery && (
              <div
                className={`filter-button ${
                  isEqual(sortByProperty, ['relevance'])
                    ? 'filter-button--active'
                    : ''
                }`}
                onClick={() => {
                  setSortByProperty(['relevance']);
                  setSortType('number');
                  setSortDirection('desc');
                }}
                role="button"
                tabIndex={0}
              >
                Relevance
                {isEqual(sortByProperty, ['relevance']) &&
                  (sortDirection === 'asc' ? ' \u25B2' : ' \u25BC')}
              </div>
            )}
            {sortOptions.sortableProperties.map(({ property, type, label }) => {
              const isActive = isEqual(property, sortByProperty);
              const color = isActive ? 'primary' : 'platinum';

              const handleSort = () => {
                setSortByProperty(property);
                setSortType(type);
              };

              return (
                <SortButton
                  key={property}
                  variable={property}
                  handleClick={handleSort}
                  color={color}
                  label={label}
                  isActive={isActive}
                  sortDirection={sortDirection}
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
                id={`hyper-list-${id.current}`}
                items={filteredResults}
                dynamicProperties={dynamicProperties}
                itemComponent={itemComponent}
                dragComponent={dragComponent}
                columns={columns}
                emptyComponent={EmptyComponent}
                placeholder={hyperListPlaceholder}
                itemType={itemType} // drop type
                accepts={accepts}
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
              value: query,
              onChange: handleChangeSearch,
            }}
          />
        </div>
      </Panel>
    </motion.div>
  );
};

SearchableList.propTypes = {
  columns: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  dragComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  items: PropTypes.array,
  placeholder: PropTypes.node,
  searchOptions: PropTypes.object,
  dynamicProperties: PropTypes.object,
  excludeItems: PropTypes.array,
  dropNodeColor: PropTypes.string,
  disabled: PropTypes.bool,
};

export default SearchableList;
