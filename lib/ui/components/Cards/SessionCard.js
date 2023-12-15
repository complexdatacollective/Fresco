import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { ProgressBar } from '..';
import HoverMarquee from '../HoverMarquee';
import StartedIcon from '../../assets/images/StartedIcon.svg';
import ModifiedIcon from '../../assets/images/ModifiedIcon.svg';
import FinishedIcon from '../../assets/images/FinishedIcon.svg';
import ExportedIcon from '../../assets/images/ExportedIcon.svg';

const formatDate = (dateString) => dateString && new Date(dateString).toLocaleString(undefined);

const SessionCard = (props) => {
  const {
    caseId,
    startedAt,
    updatedAt,
    finishedAt,
    exportedAt,
    protocolName,
    progress,
    selected,
    onClickHandler,
  } = props;

  const modifierClasses = cx(
    'session-card',
    { 'session-card--clickable': onClickHandler },
    { 'session-card--selected': selected },
  );

  return (
    <div className={modifierClasses} onClick={onClickHandler}>
      <div className="main-wrapper">
        <h2 className="card__label">
          <HoverMarquee>{ caseId }</HoverMarquee>
        </h2>
        <h5 className="card__protocol">
          <HoverMarquee>{ protocolName || (<span className="highlight">Unavailable protocol!</span>) }</HoverMarquee>
        </h5>
      </div>
      <div className="meta-wrapper">
        <div className="meta">
          <h6 className="meta-wrapper__attribute">
            <HoverMarquee>
              <img src={StartedIcon} alt="Interview started at" />
              { startedAt ? formatDate(startedAt) : (<span className="highlight">No start date!</span>) }
            </HoverMarquee>
          </h6>
          <h6 className="meta-wrapper__attribute">
            <HoverMarquee>
              <img src={ModifiedIcon} alt="Interview modified at" />
              { updatedAt ? formatDate(updatedAt) : (<span className="highlight">Never changed!</span>) }
            </HoverMarquee>
          </h6>
        </div>
        <div className="meta">
          <div className="progress-wrapper">
            <img src={FinishedIcon} alt="Interview finished at" />
            { progress === 100 && finishedAt ? (
              <span>
                { formatDate(finishedAt) }
              </span>
            ) : (
              <>
                <span>
                  {' '}
                  {progress}
                  %
                </span>
                <ProgressBar percentProgress={progress} orientation="horizontal" />
              </>
            )}

          </div>
          <h6 className="meta-wrapper__attribute">
            <HoverMarquee>
              <img src={ExportedIcon} alt="Interview exported at" />
              { exportedAt ? formatDate(exportedAt) : (<span className="highlight">Not yet exported</span>) }
            </HoverMarquee>
          </h6>
        </div>
      </div>
    </div>
  );
};

SessionCard.defaultProps = {
  onClickHandler: undefined,
  protocolName: null,
  selected: false,
  finishedAt: null,
  exportedAt: null,
};

SessionCard.propTypes = {
  caseId: PropTypes.string.isRequired,
  startedAt: PropTypes.string.isRequired, // Expects ISO 8601 datetime string
  updatedAt: PropTypes.string.isRequired, // Expects ISO 8601 datetime string
  finishedAt: PropTypes.string, // Expects ISO 8601 datetime string
  exportedAt: PropTypes.string, // Expects ISO 8601 datetime string
  protocolName: PropTypes.string,
  progress: PropTypes.number.isRequired,
  selected: PropTypes.bool,
  onClickHandler: PropTypes.func,
};

export default SessionCard;
