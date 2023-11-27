import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Dialog from './Dialog';
import Button from '../Button';

const getErrorMessage = (error) => !!error
  && (error.friendlyMessage ? error.friendlyMessage : error.toString());

const getMessage = ({ error, message }) => (error ? getErrorMessage(error) : message);

const getStack = (error) => !!error && error.stack;

const AdditionalInformation = ({ stack }) => {
  const [expanded, setExpanded] = useState(false);

  const buttonText = expanded ? 'Hide details \u25b2' : 'Show details \u25bc';

  return (
    <div className="dialog__additional">
      <motion.div
        className="dialog__additional-box"
        initial={{ height: 0 }}
        animate={expanded ? { height: 'auto' } : { height: 0 }}
      >
        <pre className="error__stack-trace">{stack}</pre>
      </motion.div>
      <Button
        size="small"
        color="platinum"
        onClick={() => setExpanded(!expanded)}
      >
        {buttonText}
      </Button>
    </div>
  );
};

AdditionalInformation.propTypes = {
  stack: PropTypes.string,
};

AdditionalInformation.defaultProps = {
  stack: null,
};

/*
 * Designed to present errors to the user. Unlike some other Dialog types user must
 * explicitly click Acknowledge to close.
 */
const ErrorDialog = ({
  error, message, onConfirm, show, confirmLabel, title,
}) => {
  const stack = getStack(error);

  return (
    <Dialog
      type="error"
      icon="error"
      show={show}
      title={title}
      message={getMessage({ error, message })}
      options={[
        <Button key="confirm" onClick={onConfirm} color="neon-coral" content={confirmLabel} />,
      ]}
    >
      {stack && <AdditionalInformation stack={stack} />}
    </Dialog>
  );
};

ErrorDialog.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.instanceOf(Error),
    PropTypes.string,
    PropTypes.shape({ friendlyMessage: PropTypes.string }),
  ]),
  title: PropTypes.string,
  message: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]),
  onConfirm: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string,
  show: PropTypes.bool,
};

ErrorDialog.defaultProps = {
  confirmLabel: 'OK',
  title: 'Something went wrong!',
  message: null,
  error: null,
  show: false,
};

export { ErrorDialog };

export default ErrorDialog;
