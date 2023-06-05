import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icon from '../Icon';

const formatDate = (timeString) => timeString && new Date(timeString).toLocaleString(undefined);

const ProtocolCard = (props) => {
  const {
    selected,
    condensed,
    schemaVersion,
    lastModified,
    installationDate,
    name,
    description,
    isOutdated,
    isObsolete,
    onStatusClickHandler,
    onClickHandler,
  } = props;

  const modifierClasses = cx(
    'protocol-card',
    { 'protocol-card--clickable': onClickHandler },
    { 'protocol-card--condensed': condensed },
    { 'protocol-card--selected': selected },
    { 'protocol-card--outdated': !isObsolete && isOutdated },
    { 'protocol-card--obsolete': isObsolete },
  );

  const renderStatusIcon = () => {
    if (isOutdated) {
      return (
        <div className="status-icon status-icon--outdated" onClick={(e) => { e.stopPropagation(); onStatusClickHandler(); }}>
          <Icon name="warning" />
        </div>
      );
    }

    if (isObsolete) {
      return (
        <div className="status-icon status-icon--obsolete" onClick={(e) => { e.stopPropagation(); onStatusClickHandler(); }}>
          <Icon name="error" />
        </div>
      );
    }

    return (
      <div className="protocol-icon">
        <Icon name="protocol-card" />
      </div>
    );
  };

  const renderDescription = () => {
    if (condensed) {
      return (
        <div className="protocol-description protocol-description--condensed">
          { description }
        </div>
      );
    }

    return (
      <div className="protocol-description">
        { description }
      </div>
    );
  };

  return (
    <div className={modifierClasses} onClick={onClickHandler}>
      <div className="protocol-card__icon-section">
        { renderStatusIcon() }
        { !condensed && (
          <div className="protocol-meta">
            {
              installationDate && (
                <h6>
                  Installed:
                  {formatDate(installationDate)}
                </h6>
              )
            }
            <h6>
              Last Modified:
              {formatDate(lastModified)}
            </h6>
            <h6>
              Schema Version:
              {schemaVersion}
            </h6>
          </div>
        ) }
      </div>
      <div className="protocol-card__main-section">
        <h2 className="protocol-name">{name}</h2>
        { description && renderDescription() }
      </div>
    </div>
  );
};

ProtocolCard.defaultProps = {
  onClickHandler: undefined,
  onStatusClickHandler: () => {},
  description: null,
  installationDate: null,
  isOutdated: false,
  isObsolete: false,
  condensed: false,
  selected: false,
};

ProtocolCard.propTypes = {
  schemaVersion: PropTypes.number.isRequired,
  lastModified: PropTypes.string.isRequired, // Expects ISO 8601 datetime string
  installationDate: PropTypes.string, // Expects ISO 8601 datetime string
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClickHandler: PropTypes.func,
  onStatusClickHandler: PropTypes.func,
  isOutdated: PropTypes.bool,
  isObsolete: PropTypes.bool,
  condensed: PropTypes.bool,
  selected: PropTypes.bool,
};

export default ProtocolCard;
