import React from "react";
import cx from "classnames";
import Icon from "@/components/Icon/Icon";
import "./ActionButton.scss";

const renderIcon = ({ icon }) => {
  let iconElement = null;
  if (icon) {
    if (typeof icon === "string") {
      iconElement = <Icon name={icon} />;
    } else {
      iconElement = React.cloneElement(icon);
    }
  }
  return iconElement;
};

export type ActionButtonProps = {
  disabled?: boolean;
  onClick?: (() => void) | undefined;
  icon?: string | React.ReactElement | undefined;
  color?: string;
  title?: string;
};

// eslint-disable-next-line react/display-name
const ActionButton = React.memo((props: ActionButtonProps) => {
  const {
    disabled = false,
    onClick = undefined,
    icon = undefined,
    color = "primary",
    title = "Add",
  } = props;

  const classes = cx({
    "action-button": true,
    "action-button--disabled": disabled,
    "action-button--clickable": onClick,
    [`action-button--${color}`]: !!color,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      title={title}
      tabIndex={0}
    >
      <div className="icon-container">{renderIcon({ icon })}</div>
      <div className="plus-button">
        <Icon name="menu-new-session" color="sea-green" size="small" />
      </div>
    </button>
  );
});

export default ActionButton;
