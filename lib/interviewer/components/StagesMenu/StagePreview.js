import React from 'react';
import { withHandlers, compose } from 'recompose';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { motion } from 'framer-motion';
import { getCSSVariableAsNumber } from '@codaco/ui/src/utils/CSSVariables';
import Image from 'next/image';

const StagePreview = ({
  item: {
    type, label, index, id,
  },
  handleOpenStage,
  active,
}) => {
  const classes = cx('stage-preview', {
    'stage-preview--current': active,
  });

  const baseAnimationDuration = getCSSVariableAsNumber('--animation-duration-standard-ms') / 1000;

  const timelineVariants = {
    expanded: {
      y: 0,
      opacity: 1,
      height: '100%',
      transition: {
        duration: baseAnimationDuration / 3,
      },
    },
    normal: {
      y: '-100%',
      opacity: 0,
      height: 0,
      transition: {
        duration: baseAnimationDuration / 3,
      },
    },
  };

  return (
    <div
      onClick={handleOpenStage}
      className={classes}
      data-stage-name={id}
      data-stage-id={index}
    >
      <motion.div
        className="stage-preview__notch"
        variants={timelineVariants}
        key={id}
      />
      <div className="stage-preview__image">
        <Image src={`/interviewer/images/timeline/stage--${type}.png`} alt="NameGenerator Interface" title="NameGenerator Interface" width={128} height={92} />
      </div>
      <div className="stage-preview__label">
        {index + 1}
        .
        {' '}
        {label}
      </div>
    </div>
  );
};

const stagePreviewHandlers = withHandlers({
  handleOpenStage: (props) => () => {
    const {
      item: { index: stageIndex },
      onStageSelect,
      setExpanded,
    } = props;

    onStageSelect(stageIndex);
    setExpanded(false);
  },
});

StagePreview.propTypes = {
  item: PropTypes.object.isRequired,
  active: PropTypes.bool.isRequired,
  handleOpenStage: PropTypes.func.isRequired,
};

export default compose(
  stagePreviewHandlers,
)(StagePreview);
