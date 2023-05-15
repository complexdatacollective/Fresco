import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { motion } from 'framer-motion';
import Date from './DatePicker/Date';
import { getMonthName } from './helpers';

const DatePreview = ({ onClick, isActive, placeholder }) => (
  <Date>
    {({
      date, type, onChange, isComplete, isEmpty,
    }) => {
      const previewRef = React.createRef();

      const handleClickYear = (e) => {
        e.stopPropagation();
        onChange({ year: null, month: null, day: null });
        onClick();
      };

      const handleClickMonth = (e) => {
        e.stopPropagation();
        onChange({ month: null, day: null });
        onClick();
      };

      const handleClickDay = (e) => {
        e.stopPropagation();
        onChange({ day: null });
        onClick();
      };

      const handleClickPreview = () => {
        if (isComplete) { return; }
        onClick();
      };

      const handleClear = (e) => {
        e.stopPropagation();
        onChange({ year: null, month: null, day: null });
        onClick(false);
      };

      const previewClass = cx(
        'date-picker__preview',
        { 'date-picker__preview--is-empty': isEmpty },
      );

      if (!isActive && isEmpty && placeholder) {
        return (
          <motion.div
            className={previewClass}
            onClick={handleClickPreview}
            // layout
            ref={previewRef}
          >
            <span className="date-picker__placeholder">{placeholder}</span>
          </motion.div>
        );
      }

      return (
        <motion.div
          className={previewClass}
          onClick={handleClickPreview}
          // layout
          ref={previewRef}
        >
          <div
            className={cx('date-picker__preview-part', { 'date-picker__preview-part--is-set': date.year })}
            onClick={handleClickYear}
          >
            {date.year || 'Year'}
          </div>
          {['full', 'month'].includes(type)
            && <div className="date-picker__preview-divider">/</div>}
          {['full', 'month'].includes(type)
            && (
              <div
                className={cx('date-picker__preview-part', { 'date-picker__preview-part--is-set': date.month })}
                onClick={handleClickMonth}
              >
                {getMonthName(date.month) || 'Month'}
              </div>
            )}
          {['full'].includes(type)
            && <div className="date-picker__preview-divider">/</div>}
          {['full'].includes(type)
            && (
              <div
                className={cx('date-picker__preview-part', { 'date-picker__preview-part--is-set': date.day })}
                onClick={handleClickDay}
              >
                {date.day || 'Day'}
              </div>
            )}
          <div
            className={cx('date-picker__preview-clear', { 'date-picker__preview-clear--is-visible': !isEmpty || isActive })}
            onClick={handleClear}
          >
            clear
          </div>
        </motion.div>
      );
    }}
  </Date>
);

DatePreview.propTypes = {
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
  placeholder: PropTypes.string,
};

DatePreview.defaultProps = {
  onClick: () => { },
  isActive: false,
  placeholder: null,
};

export default DatePreview;
