import React from 'react';
import PropTypes from 'prop-types';
import Dialog from './Dialog';
import Button from '../Button';

/*
 * Designed to present yes/no choices to the user.
 */
const Confirm = ({
  title,
  message,
  canCancel,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  show,
}) => (
  <Dialog
    type="confirm"
    icon="info"
    show={show}
    title={title}
    message={message}
    onBlur={onCancel}
    options={[
      canCancel ? <Button key="cancel" onClick={onCancel} color="navy-taupe" content={cancelLabel} /> : null,
      <Button key="confirm" onClick={onConfirm} color="sea-green" content={confirmLabel} />,
    ]}
  />
);

Confirm.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.node,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  canCancel: PropTypes.bool,
  show: PropTypes.bool,
};

Confirm.defaultProps = {
  message: null,
  onCancel: null,
  confirmLabel: 'OK',
  cancelLabel: 'Cancel',
  canCancel: true,
  show: false,
};

export { Confirm };

export default Confirm;
