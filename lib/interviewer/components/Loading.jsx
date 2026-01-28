import cx from 'classnames';
import { motion } from 'motion/react';
import PropTypes from 'prop-types';
import { Spinner } from '~/lib/legacy-ui/components';

const Loading = ({ message, className, small = false }) => (
  <motion.div
    className={cx('loading', className)}
    key="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <h2>{message}</h2>
    <Spinner small={small} />
  </motion.div>
);

Loading.propTypes = {
  message: PropTypes.string,
  className: PropTypes.string,
  small: PropTypes.bool,
};

export default Loading;
