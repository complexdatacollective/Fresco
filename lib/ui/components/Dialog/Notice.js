import PropTypes from 'prop-types';
import Button from '../Button';
import Dialog from './Dialog';

/*
 * Designed to present notices to the user.
 */
const Notice = ({
  title,
  message,
  onConfirm,
  confirmLabel = 'OK',
  show = false,
}) => (
  <Dialog
    type="notice"
    icon="info"
    show={show}
    title={title}
    message={message}
    onBlur={() => onConfirm?.()}
    options={[
      <Button
        key="confirm"
        onClick={() => onConfirm?.()}
        color="primary"
        content={confirmLabel}
      />,
    ]}
  />
);

Notice.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.node,
  onConfirm: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string,
  show: PropTypes.bool,
};

export default Notice;
