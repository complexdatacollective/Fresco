import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import logo from '../../assets/images/Srv-Flat.svg';
import HoverMarquee from '../HoverMarquee';

/**
 * Renders a server icon & label. The label defaults to server name, falling back
 * to its first address (both provided via the `data` prop). If `secondaryLabel`
 * is provided, then it will be appended.
 */
const ServerCard = ({
  name,
  addresses,
  host,
  onClickHandler,
  disabled,
}) => {
  const label = name || addresses[0];

  const modifierClasses = cx(
    'server-card',
    { 'server-card--clickable': onClickHandler },
    { 'server-card--disabled': disabled },
  );

  return (
    <div className={modifierClasses} onClick={onClickHandler}>
      <div className="server-card__icon-section">
        <div className="server-icon">
          <img src={logo} alt="" />
        </div>
      </div>
      <div className="server-card__main-section">
        <h2 className="server-name"><HoverMarquee>{label}</HoverMarquee></h2>
        <h6>
          <HoverMarquee>
            Addresses:
            {
            addresses.map((address, index) => (
              <React.Fragment key={index}>
                [
                {address}
                ]
                {index !== addresses.length - 1 && (',')}
              </React.Fragment>
            ))
}
          </HoverMarquee>
        </h6>
        <h6>
          <HoverMarquee>
            Host:
            {host}
          </HoverMarquee>
        </h6>
      </div>
    </div>
  );
};

ServerCard.propTypes = {
  name: PropTypes.string,
  addresses: PropTypes.array.isRequired,
  host: PropTypes.string,
  onClickHandler: PropTypes.func,
  disabled: PropTypes.bool,
};

ServerCard.defaultProps = {
  name: undefined,
  onClickHandler: undefined,
  host: null,
  disabled: false,
};

export default ServerCard;
