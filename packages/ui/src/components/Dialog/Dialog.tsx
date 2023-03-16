import React from "react";
import cx from "classnames";
import Modal from "@/components/Modal/Modal";
import Icon from "@/components/Icon/Icon";

/*
 * Top level Dialog component, not intended to be used directly, if you need
 * a specific type of Dialog, create in the pattern of Notice
 */

type DialogProps = {
  show: boolean;
  showIcon?: boolean;
  title: string;
  message: React.ReactNode | string;
  type?: string;
  icon?: string;
  children?: React.ReactNode;
  options?: React.ReactNode;
  onBlur?: () => void;
  classNames?: string;
};

function Dialog({
  children = null,
  type = "",
  icon = "",
  show,
  showIcon = true,
  options = null,
  title,
  message,
  onBlur = () => {},
  classNames = "",
}: DialogProps) {
  return (
    <Modal show={show} onBlur={onBlur}>
      <div className={cx("dialog", { [`dialog--${type}`]: type }, classNames)}>
        <div className="dialog__main">
          {icon && showIcon && (
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
        <footer className="dialog__footer">{options}</footer>
      </div>
    </Modal>
  );
}

export default Dialog;
