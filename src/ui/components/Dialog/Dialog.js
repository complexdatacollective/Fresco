import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Modal from '../Modal';
import Icon from '../Icon';

/*
 * Top level Dialog component, not intended to be used directly, if you need
 * a specific type of Dialog, create in the pattern of Notice
 */
const Dialog = ({
  children, type, icon, show, options, title, message, onBlur, classNames,
}) => (
  <Modal show={show} onBlur={onBlur}>
    <div className={cx('dialog', { [`dialog--${type}`]: type }, classNames)}>
      <div className="dialog__main">
        { icon
          && (
          <div className="dialog__main-icon">
            <Icon name={icon} />
          </div>
          )}
        <div className="dialog__main-content">
          <h2 className="dialog__main-title">{title}</h2>
          {message}
          {children}
        </div>
      </div>
      <footer className="dialog__footer">
        {options}
      </footer>
    </div>
  </Modal>
);

Dialog.propTypes = {
  show: PropTypes.bool,
  title: PropTypes.string.isRequired,
  message: PropTypes.node,
  type: PropTypes.string,
  icon: PropTypes.string,
  children: PropTypes.node,
  options: PropTypes.arrayOf(PropTypes.element),
  onBlur: PropTypes.func,
  classNames: PropTypes.string,
};

Dialog.defaultProps = {
  show: false,
  type: null,
  icon: null,
  message: null,
  children: null,
  options: [],
  onBlur: () => {},
  classNames: null,
};

export { Dialog };

export default Dialog;
