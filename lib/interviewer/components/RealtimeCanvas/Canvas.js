import cx from 'classnames';
import PropTypes from 'prop-types';

/**
 * Wrapper component for consistent positioning between canvas modules
 */
const Canvas = ({ children, className }) => {
  return (
    <div className={cx('canvas', className)} style={{ width: '100%', height: '100%', position: 'relative' }}>{children}</div>
  );
}

Canvas.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Canvas;
