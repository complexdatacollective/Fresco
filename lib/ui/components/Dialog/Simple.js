import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import Modal from '../Modal';

/**
 * A relatively unstyled dialog for use in other kinds of modals
 */
const SimpleDialog = ({
  children,
  show,
  options,
  title,
  onBlur,
  className,
  style,
}) => (
  <Modal show={show} onBlur={onBlur}>
    <div
      className={cx('dialog', 'dialog--simple', className)}
      style={style}
    >
      <div className="dialog__main">
        <div className="dialog__main-content">
          <h2 className="dialog__main-title">{title}</h2>
          {children}
        </div>
      </div>
      <footer className="dialog__footer">
        {options}
      </footer>
    </div>
  </Modal>
);

SimpleDialog.propTypes = {
  show: PropTypes.bool,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  options: PropTypes.arrayOf(PropTypes.element),
  onBlur: PropTypes.func,
  style: PropTypes.object,
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

SimpleDialog.defaultProps = {
  show: false,
  children: null,
  options: [],
  onBlur: () => {},
  style: {},
  className: null,
};

export { SimpleDialog };

export default SimpleDialog;
