import cx from 'classnames';
import { noop } from 'es-toolkit';
import React, { type ButtonHTMLAttributes, type ReactElement } from 'react';
import Icon from './Icon';

const renderIcon = (icon: ReactElement | string | undefined) => {
  let iconElement = null;
  if (icon) {
    if (typeof icon === 'string') {
      iconElement = <Icon name={icon} />;
    } else {
      iconElement = React.cloneElement(icon);
    }
  }
  return iconElement;
};

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  disabled?: boolean;
  onClick?: () => void;
  icon?: string | ReactElement;
  color?: string;
  title?: string;
  showPlusButton?: boolean;
};

export default function ActionButton(props: ActionButtonProps) {
  const {
    disabled = false,
    onClick = noop,
    icon,
    color,
    title = 'Add',
    showPlusButton = true,
  } = props;

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  const classes = cx({
    'action-button': true,
    'action-button--disabled': disabled,
    'action-button--clickable': onClick !== noop,
    [`action-button--${color}`]: !!color,
  });

  return (
    <button
      type="button"
      onClick={handleClick}
      className={classes}
      title={title}
      tabIndex={0}
      disabled={disabled}
    >
      <div className="icon-container">{renderIcon(icon)}</div>
      {showPlusButton && (
        <div className="plus-button">
          <Icon name="menu-new-session" color="sea-green" size="small" />
        </div>
      )}
    </button>
  );
}
