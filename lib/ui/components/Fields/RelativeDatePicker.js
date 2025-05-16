import { DATE_FORMATS } from '@codaco/protocol-validation';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import DatePicker from './DatePicker';

const DATE_FORMAT = DATE_FORMATS.full;

/**
 * A relative version of the date picker.
 *
 * Selectable range is determined as days relative to
 * an anchor date (defaults to 'today' e.g. interview date,
 * when not set).
 */
const RelativeDatePicker = ({ parameters = {}, ...rest }) => {
  const anchor = parameters.anchor
    ? DateTime.fromISO(parameters.anchor)
    : DateTime.local();

  const min = anchor
    .minus({ days: parameters.before || 180 })
    .toFormat(DATE_FORMAT);

  const max = anchor
    .plus({ days: parameters.after || 0 })
    .toFormat(DATE_FORMAT);

  const newParameters = {
    min,
    max,
  };

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DatePicker {...rest} parameters={newParameters} />;
};

RelativeDatePicker.propTypes = {
  parameters: PropTypes.object,
};

export default RelativeDatePicker;
