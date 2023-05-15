import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { motion, AnimateSharedLayout, AnimatePresence } from 'framer-motion';
import DatePicker from './DatePicker/DatePicker';
import Years from './DatePicker/Years';
import Months from './DatePicker/Months';
import Days from './DatePicker/Days';
import Date from './DatePicker/Date';
import Panels from './Panels';
import Panel from './Panel';
import RangePicker from './RangePicker';
import DatePreview from './DatePreview';
import {
  now, isEmpty, getFirstDayOfMonth, hasProperties,
} from './helpers';
import useScrollTo from '../../../hooks/useScrollTo';

const DatePickerInput = ({
  onChange: onChangeInput,
  value,
  parameters,
  parentRef,
  placeholder,
}) => {
  const ref = useRef();

  const [panelsOpen, setPanelsOpen] = useState(false);

  const handleChange = useCallback((newValue) => {
    if (newValue !== '') { setPanelsOpen(false); }
    if (newValue !== value) { onChangeInput(newValue); }
  }, [value, setPanelsOpen, onChangeInput]);

  const handleClickOutside = (e) => {
    if (ref.current.contains(e.target)) {
      // inside click
      return;
    }
    // outside click
    setPanelsOpen(false);
  };

  useScrollTo(parentRef, (open) => open, [panelsOpen, parentRef]);

  useEffect(() => {
    if (panelsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [panelsOpen]);

  // treat empty string as no value (for Redux Forms)
  const initialDate = isEmpty(value) ? null : value;
  const handleClickPreview = (open = true) => setPanelsOpen(open);
  const today = now().toObject();

  const datePickerClasses = cx(
    'date-picker',
    { 'date-picker--is-active': panelsOpen },
  );

  const handleFocus = () => {
    if (isEmpty(value)) {
      setPanelsOpen(true);
    }
  };

  return (
    <DatePicker
      onChange={handleChange}
      date={initialDate}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...parameters}
    >
      <Date>
        {({
          date, range: dateRange, isComplete, type, onChange,
        }) => {
          const canSetMonth = ['full', 'month'].includes(type);
          const canSetDay = ['full'].includes(type);
          const isYearActive = hasProperties([], ['year'])(date);
          const isYearComplete = hasProperties(['year'])(date);
          const isMonthActive = hasProperties(['year'], ['month'])(date);
          const isMonthComplete = hasProperties(['month'])(date);
          const isDayActive = hasProperties(['year', 'month'], ['day'])(date);
          const isDayComplete = hasProperties(['day'])(date);
          const todayYear = today.year;
          const todayMonth = date.year === today.year ? today.month : null;
          const todayDay = date.year === today.year && date.month === today.month
            ? today.day : null;

          const handleBlur = (e) => {
            if (!e.target.classList.contains('date-picker')) { return; }
            // dump incomplete state
            if (!isComplete) {
              onChange({ year: null, month: null, day: null });
            }
            // setPanelsOpen(false);
          };

          return (
            <AnimateSharedLayout>
              <motion.div
                className={datePickerClasses}
                onBlur={handleBlur}
                onFocus={handleFocus}
                tabIndex="0"
                role="button"
              >
                <DatePreview
                  onClick={handleClickPreview}
                  isActive={panelsOpen}
                  placeholder={placeholder}
                />
                <motion.div ref={ref} layout className="date-picker__container">
                  <AnimatePresence>
                    {panelsOpen
                      && (
                        <Panels>
                          <Panel
                            isActive={isYearActive}
                            isComplete={isYearComplete}
                            type="year"
                          >
                            <Years>
                              {({ years }) => (
                                <RangePicker
                                  type="year"
                                  today={todayYear}
                                  range={years}
                                  value={date.year}
                                  offset={(dateRange.start.year) % 5}
                                  onSelect={(y) => onChange({ year: y, month: null, day: null })}
                                />
                              )}
                            </Years>
                          </Panel>
                          {canSetMonth
                            && (
                              <Panel
                                isActive={isMonthActive}
                                isComplete={isMonthComplete}
                                type="month"
                              >
                                <Months>
                                  {({ months }) => (
                                    <RangePicker
                                      type="month"
                                      today={todayMonth}
                                      range={months}
                                      value={date.month}
                                      onSelect={(m) => onChange({ month: m, day: null })}
                                    />
                                  )}
                                </Months>
                              </Panel>
                            )}
                          {canSetDay
                            && (
                              <Panel
                                isActive={isDayActive}
                                isComplete={isDayComplete}
                                type="day"
                              >
                                <Days>
                                  {({ days }) => (
                                    <RangePicker
                                      type="day"
                                      today={todayDay}
                                      range={days}
                                      value={date.day}
                                      offset={getFirstDayOfMonth(date) - 1}
                                      onSelect={(d) => onChange({ day: d })}
                                    />
                                  )}
                                </Days>
                              </Panel>
                            )}
                        </Panels>
                      )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </AnimateSharedLayout>
          );
        }}
      </Date>
    </DatePicker>
  );
};

DatePickerInput.defaultProps = {
  value: null,
  parameters: {},
  onChange: () => { },
  placeholder: null,
};

DatePickerInput.propTypes = {
  onChange: PropTypes.func,
  parameters: PropTypes.object,
  value: PropTypes.string,
  parentRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]).isRequired,
  placeholder: PropTypes.string,
};

export default DatePickerInput;
