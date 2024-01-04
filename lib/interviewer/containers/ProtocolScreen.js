import React, { useState } from 'react';
import Stage from './Stage';
import { AnimatePresence, motion } from 'framer-motion';
import { getCurrentStage } from '../selectors/session';
import { useSelector } from 'react-redux';
import Navigation from '../components/Navigation';

const ProtocolScreen = (props) => {
  const currentStage = useSelector(getCurrentStage);
  const [beforeNextFunctions, setBeforeNextFunctions] = useState({});
  const [pendingStage, setPendingStage] = useState(-1);
  const [pendingDirection, setPendingDirection] = useState(1);

  const onComplete = (directionOverride) => {
    const { goToNext } = props;
    const nextDirection = directionOverride || pendingDirection;

    const navigate =
      pendingStage === -1
        ? () => goToNext(nextDirection)
        : () => goToStage(pendingStage);

    setPendingStage(-1);
    setPendingDirection(1);
    navigate();
  };

  const registerBeforeNext = (beforeNext, stageId) => {
    if (beforeNext === null) return;

    setBeforeNextFunctions((prevFunctions) => ({
      ...prevFunctions,
      [stageId]: beforeNext,
    }));
  };

  const goToStage = (index) => {
    const { isSkipped, openDialog, goToStage } = props;
    if (isSkipped(index)) {
      openDialog({
        type: 'Warning',
        title: 'Show this stage?',
        confirmLabel: 'Show Stage',
        onConfirm: () => goToStage(index),
        message: (
          <p>
            Your skip logic settings would normally prevent this stage from
            being shown in this interview. Do you want to show it anyway?
          </p>
        ),
      });
    } else {
      goToStage(index);
    }
  };

  if (!currentStage) {
    return null;
  }

  return (
    <motion.div
      className="flex w-full flex-1 flex-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Navigation />
      <AnimatePresence mode="wait" initial={false}>
        <Stage
          key={currentStage.id}
          stage={currentStage}
          registerBeforeNext={registerBeforeNext}
          onComplete={onComplete}
        />
      </AnimatePresence>
    </motion.div>
  );
};

export default ProtocolScreen;
