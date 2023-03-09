import React from 'react';
import cx from 'classnames';
import './Button.scss';
import Icon from './Icon';

// Return an icon element if an icon is provided
const getButtonIcon = ({ icon, iconPosition } : { icon: string | JSX.Element, iconPosition: ButtonProps['iconPosition'] }) => {
  const iconClassNames = cx({
    button__icon: true,
    'button__icon--right': iconPosition === 'right',
  });

  let iconElement;
  if (icon) {
    if (typeof icon === 'string') {
      // eslint-disable-next-line
      iconElement = <Icon name={icon} className={iconClassNames} />;
    } else {
      iconElement = React.cloneElement(
        icon,
        { className: iconClassNames },
      );
    }
  }
  return iconElement as JSX.Element;
};

type ButtonProps = {
  color?: string;
  size?: 'small' | 'medium' | 'large';
  children?: string | undefined;
  content?: string | undefined;
  onClick?: () => void;
  icon?: string | React.ReactElement | undefined;
  type?: 'button' | 'submit';
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
};

function Button({
  color = 'primary',
  size = 'medium',
  children = undefined,
  content = 'Button',
  onClick = () => {},
  icon = undefined,
  type = 'button',
  iconPosition = 'left',
  disabled = false,
}: ButtonProps) {
  const buttonClassNames = cx({
    button: true,
    [`button--${color}`]: !!color,
    [`button--${size}`]: !!size,
    'button--has-icon': !!icon,
    'button--icon-pos-right': iconPosition === 'right',
  });

  return (
    <button
      type={type && type === 'button' ? 'button' : 'submit'} // Needed because of this insanity: https://github.com/jsx-eslint/eslint-plugin-react/issues/1555
      className={buttonClassNames}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && getButtonIcon({ icon, iconPosition })}
      {(content || children) && <span className="button__content">{children || content}</span>}
    </button>
  );
}

export default Button;
