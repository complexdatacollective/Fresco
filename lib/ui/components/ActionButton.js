import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { noop } from 'lodash';
import Icon from './Icon';

const renderIcon = ({ icon }) => {
  let iconElement = null;
  if (icon) {
    if (typeof icon === 'string') {
      // eslint-disable-next-line
      const Icon = require('./Icon').default;
      iconElement = <Icon name={icon} />;
    } else {
      iconElement = React.cloneElement(icon);
    }
  }
  return iconElement;
};

const ActionButton = React.memo((props) => {
  const {
    disabled,
    onClick,
    icon,
    color,
    title = 'Add',
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
      tabIndex="0"
      disabled={disabled}
    >
      <div className="icon-container">
        {renderIcon({ icon })}
      </div>
      <div className="plus-button">
        <Icon
          name="menu-new-session"
          color="sea-green"
          size="small"
        />
      </div>
    </button>
  );
});

ActionButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  icon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
  ]),
  color: PropTypes.string,
  title: PropTypes.string,
};

ActionButton.defaultProps = {
  disabled: false,
  onClick: noop,
  icon: null,
  color: null,
  title: 'Add',
};

export default ActionButton;
