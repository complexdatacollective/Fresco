import React, { useMemo, useRef, useId } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { motion } from 'framer-motion';
import { isEqual, get } from 'lodash';
import Button from '../Button';
import { getCSSVariableAsNumber } from '../../utils/CSSVariables';
import Search from '../Fields/Search';
import useSort from '../../hooks/useSort';
import useSearch from '../../hooks/useSearch';
import useAnimationSettings from '../../hooks/useAnimationSettings';
import ItemList from './ItemList';

export const modes = {
  LIST: Symbol('LIST'), // Fixed width items
  CARDS: Symbol('CARDS'), // Variable width items
  DETAILS: Symbol('DETAILS'), // Table
};

const EmptyComponent = () => (
  <div className="searchable-list__placeholder">
    No results.
  </div>
);

const HyperList = ({
  excludeItems,
  itemComponent,
  items,
  placeholder,
  searchTermPlaceholder,
  searchOptions,
  sortOptions,
  sortableProperties,
}) => {
  const id = useId();
  const [results, query, setQuery, isWaiting, hasQuery] = useSearch(items, searchOptions);

  const [
    sortedResults,
    sortByProperty,
    sortDirection,
    setSortByProperty,
  ] = useSort(results, get(sortOptions, 'initialSortOrder', undefined));

  const filteredResults = useMemo(
    () => {
      if (!excludeItems || !sortedResults) { return sortedResults; }
      return sortedResults.filter((item) => !excludeItems.includes(item.id));
    },
    [sortedResults, excludeItems],
  );

  const handleChangeSearch = (eventOrValue) => {
    const value = get(eventOrValue, ['target', 'value'], eventOrValue);
    setQuery(value);
  };

  const mode = items.length > 100 ? modes.LARGE : modes.SMALL;

  const hyperListPlaceholder = placeholder || (
    isWaiting
      ? (
        <div className="searchable-list__placeholder">
          <h4>Searching</h4>
        </div>
      )
      : null
  );

  const showTooMany = mode === modes.LARGE && !hasQuery;

  const canSort = get(sortOptions, 'sortableProperties', []).length > 0;

  const animationDuration = getCSSVariableAsNumber('--animation-duration-standard-ms') / 1000;

  const variants = {
    visible: { opacity: 1, transition: { duration: animationDuration } },
    hidden: { opacity: 0 },
  };

  const listClasses = cx(
    'searchable-list__list',
    { 'searchable-list__list--can-sort': canSort },
    { 'searchable-list__list--too-many': showTooMany },
  );

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className="searchable-list"
    >
      <div className={listClasses}>
        <ItemList
          items={filteredResults}
          itemComponent={itemComponent}
        />
        {showTooMany && (
          <div
            className="searchable-list__too-many"
          >
            <h2>Too many to display. Filter the list below, to see results.</h2>
          </div>
        )}
      </div>
      {canSort && (
        <div className="searchable-list__sort">
          {get(sortOptions, 'sortableProperties', []).map(({ variable, label }) => {
            const isActive = isEqual(variable, sortByProperty);
            const color = isActive ? 'primary' : 'platinum';
            return (
              <Button
                onClick={() => setSortByProperty(variable)}
                type="button"
                key={variable}
                color={color}
              >
                {label}

                {isActive && (
                  sortDirection === 'asc' ? ' \u25B2' : ' \u25BC'
                )}
              </Button>
            );
          })}
        </div>
      )}
      <div className="searchable-list__search">
        <Search
          placeholder={searchTermPlaceholder}
          input={{
            value: query,
            onChange: handleChangeSearch,
          }}
        />
      </div>
    </motion.div>
  );
};

HyperList.propTypes = {
  columns: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.func,
  ]),
  itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  items: PropTypes.array,
  placeholder: PropTypes.node,
  searchTermPlaceholder: PropTypes.string,
  searchOptions: PropTypes.object,
  sortableProperties: PropTypes.array,
  excludeItems: PropTypes.array,
};

HyperList.defaultProps = {
  columns: undefined,
  itemComponent: null,
  items: [],
  placeholder: null,
  searchTermPlaceholder: 'Enter a search term...',
  searchOptions: {},
  sortableProperties: [],
  excludeItems: [],
};

export default HyperList;
