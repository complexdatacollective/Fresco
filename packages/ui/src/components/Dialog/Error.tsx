import React, { useState } from "react";
import { motion } from "framer-motion";
import Dialog from "./Dialog";
import Button from "../Button/Button";

const getStack = (error: Error) => !!error && error.stack;

// Render an Error's stack trace in a collapsible box
function AdditionalInformation({ stack = "" }: { stack: string }) {
  const [expanded, setExpanded] = useState(false);

  const buttonText = expanded ? "Hide details \u25b2" : "Show details \u25bc";

  return (
    <div className="dialog__additional">
      <motion.div
        className="dialog__additional-box"
        initial={{ height: 0 }}
        animate={expanded ? { height: "auto" } : { height: 0 }}
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
}

/*
 * Designed to present errors to the user. Unlike some other Dialog types user must
 * explicitly click Acknowledge to close.
 */

type ErrorDialogProps = {
  error: Error;
  title?: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
  show: boolean;
};

function ErrorDialog({
  error,
  message,
  onConfirm,
  show,
  confirmLabel = "OK",
  title = "Something went wrong!",
}: ErrorDialogProps) {
  const stack = getStack(error);

  return (
    <Dialog
      type="error"
      icon="error"
      show={show}
      title={title}
      message={message || error.message}
      options={[
        <Button
          key="confirm"
          onClick={onConfirm}
          color="neon-coral"
          content={confirmLabel}
        />,
      ]}
    >
      {stack && <AdditionalInformation stack={stack} />}
    </Dialog>
  );
}

export default ErrorDialog;
