import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { ProgressBar } from '..';
import HoverMarquee from '../HoverMarquee';
import StartedIcon from '../../../public/assets/images/StartedIcon.svg';
import ModifiedIcon from '../../../public/assets/images/ModifiedIcon.svg';
import FinishedIcon from '../../../public/assets/images/FinishedIcon.svg';
import ExportedIcon from '../../../public/assets/images/ExportedIcon.svg';
import Skeleton from '../Skeleton';

const formatDate = (dateString) => dateString && new Date(dateString).toLocaleString(undefined);

// const HoverMarquee = HoverTest;

const SessionCard = React.memo((props) => {
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
    loading,
  } = props;

  const modifierClasses = cx(
    'session-card',
    { 'session-card--clickable': onClickHandler },
    { 'session-card--selected': selected },
  );

  return (
    <div
      className={modifierClasses}
      onClick={onClickHandler}
      onKeyDown={onClickHandler}
      role="button"
      tabIndex={0}
    >
      <div className="main-wrapper">
        <h2 className="card__label">
          {loading ? <Skeleton width="60%" /> : <HoverMarquee>{caseId}</HoverMarquee>}
        </h2>
        <h5 className="card__protocol">
          {loading ? <Skeleton /> : <HoverMarquee>{protocolName || (<span className="highlight">Unavailable protocol!</span>)}</HoverMarquee>}
        </h5>
      </div>
      <div className="meta-wrapper">
        <div className="meta">
          <h6 className="meta-wrapper__attribute">
            {loading ? <Skeleton width="90%" /> : (
              <HoverMarquee>
                <img src={StartedIcon} alt="Interview started at" />
                {startedAt ? formatDate(startedAt) : (<span className="highlight">No start date!</span>)}
              </HoverMarquee>
            )}
          </h6>
          <h6 className="meta-wrapper__attribute">
            {loading ? <Skeleton width="90%" /> : (
              <HoverMarquee>
                <img src={ModifiedIcon} alt="Interview modified at" />
                {updatedAt ? formatDate(updatedAt) : (<span className="highlight">Never changed!</span>)}
              </HoverMarquee>
            )}
          </h6>
        </div>
        <div className="meta">
          <h6 className="meta-wrapper__attribute progress-wrapper">
            {loading ? <Skeleton width="90%" /> : (
              <>
                <img src={FinishedIcon} alt="Interview finished at" />
                {progress === 100 && finishedAt ? (
                  <div>
                    {formatDate(finishedAt)}
                  </div>
                ) : (
                  <>
                    <div>
                      {' '}
                      {progress}
                      %
                    </div>
                    <ProgressBar percentProgress={progress} orientation="horizontal" />
                  </>
                )}
              </>
            )}
          </h6>
          <h6 className="meta-wrapper__attribute">
            {loading ? <Skeleton width="90%" /> : (
              <HoverMarquee>
                <img src={ExportedIcon} alt="Interview exported at" />
                {exportedAt ? formatDate(exportedAt) : (<span className="highlight">Not yet exported</span>)}
              </HoverMarquee>
            )}
          </h6>
        </div>
      </div>
    </div>
  );
});

SessionCard.defaultProps = {
  onClickHandler: undefined,
  protocolName: null,
  selected: false,
  finishedAt: null,
  exportedAt: null,
  loading: false,
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
  loading: PropTypes.bool,
};

export default SessionCard;
