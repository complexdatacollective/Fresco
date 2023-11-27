import React, { useCallback, useMemo, useRef, useState } from 'react';
import Timeline from '../components/SessionPanel/SessionPanel';
import Stage from './Stage';
import { AnimatePresence, motion } from 'framer-motion';
import { useInterview } from '~/providers/InterviewProvider';
import { getProtocolStages } from '../selectors/protocol';
import { getSessionProgress } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { useDispatch, useSelector } from 'react-redux';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';

const ProtocolScreen = () => {

  const {
    currentStageIndex,
    previousPage,
    nextPage,
    goToPage,
  } = useInterview();

  // "mapStateToProps"
  const protocolStages = useSelector(getProtocolStages);
  const stage = protocolStages[currentStageIndex] || {};
  const { percentProgress, currentPrompt: promptId } = useSelector(getSessionProgress);
  const skipMap = useSelector(getSkipMap);
  const isSkipped = (index) => skipMap[index].isSkipped;

  // "mapDispatchToProps"
  const dispatch = useDispatch();
  const openDialog = (dialog) => dispatch(dialogActions.openDialog(dialog));

  // Ref used to hold beforeNext functions for any stage that registered one
  const beforeNext = useRef({});

  // Called by a stage to force navigation after a beforeNext function
  const onComplete = (_directionOverride) => {
    // const { pendingStage, pendingDirection } = navigationState;
    // const nextDirection = directionOverride || pendingDirection;

    // const navigate = (pendingStage === -1)
    //   ? () => goToNext(nextDirection)
    //   : () => goToPage(pendingStage);
    // setNavigationState(
    //   { ...initialNavigationState },
    //   navigate,
    // );

    debugger;
  }

  // Stages call this to register a beforeNext function
  const registerBeforeNext = (beforeNextFn, stageIndex) => {
    if (beforeNextFn === null) {
      delete beforeNext.current[stageIndex];
      return;
    }

    beforeNext.current[stageIndex] = beforeNextFn;
  };

  const go = (direction) => {
    const goFn = (direction === 'backwards') ? previousPage : nextPage;

    if (!beforeNext.current[currentStageIndex]) {
      goFn();
      return;
    }

    beforeNext.current[currentStageIndex]();
  };

  const handleClickBack = () => go('backwards');
  const handleClickNext = () => go('forwards');

  const goToStage = (index) => {
    if (isSkipped(index)) {
      openDialog({
        type: 'Warning',
        title: 'Show this stage?',
        confirmLabel: 'Show Stage',
        onConfirm: () => goToPage(index),
        message: (
          <p>
            Your skip logic settings would normally prevent this stage from being shown in this
            interview. Do you want to show it anyway?
          </p>
        ),
      });
    } else {
      goToPage(index + 1);
    }
  }

  const handleStageSelect = (index) => {
    if (!beforeNext.current[index]) {
      goToStage(index);
      return;
    }

    beforeNext.current[index]();
  }


  return (
    <motion.div className='protocol' initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Timeline
        id="TIMELINE"
        onClickBack={handleClickBack}
        onClickNext={handleClickNext}
        onStageSelect={handleStageSelect}
        percentProgress={percentProgress}
      />
      <AnimatePresence mode='wait' initial={false}>
        <motion.div
          key={stage.id}
          className='protocol__content'
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            type: 'spring',
            damping: 20,
          }}
        >
          <Stage
            stage={stage}
            promptId={promptId}
            stageIndex={currentStageIndex}
            registerBeforeNext={registerBeforeNext}
            onComplete={onComplete}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default ProtocolScreen;