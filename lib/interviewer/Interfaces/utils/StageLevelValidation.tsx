import { defaultTo } from 'es-toolkit/compat';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import {
  type ComponentType,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import Icon from '~/lib/ui/components/Icon';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './constants';

/**
 * Simple wrapper to add self-dismissing behaviour to a component
 * @param {*} show - Whether to show the component
 * @param {*} onHideCallback - Callback to run when the component is hidden
 * @param {*} timeoutDuration - How long to wait before hiding the component
 * @returns {Component} - Wrapped component
 */

const SelfDismissingNote = <P extends object>(
  Wrapped: ComponentType<P>,
): ComponentType<
  {
    show?: boolean;
    onHideCallback?: () => void;
    timeoutDuration?: number;
    key?: React.Key;
  } & P
> => {
  const SelfDismissingNoteInner = ({
    show,
    onHideCallback = () => undefined,
    timeoutDuration = 4000,
    ...rest
  }: {
    show?: boolean;
    onHideCallback?: () => void;
    timeoutDuration?: number;
  } & P) => {
    const [visible, setVisible] = useState(show);
    const [mouseOver, setMouseOver] = useState(false);
    const timeout = useRef<NodeJS.Timeout>();
    const key = useId();

    const handleHide = useCallback(() => {
      if (timeoutDuration > 0) {
        setVisible(false);
        onHideCallback();
      }
    }, [onHideCallback, timeoutDuration]);

    useEffect(() => {
      if (show) {
        setVisible(true);
      }

      if (!show) {
        setVisible(false);
      }
    }, [show]);

    useEffect(() => {
      if (mouseOver) {
        clearTimeout(timeout.current);
      }

      if (!mouseOver && visible) {
        timeout.current = setTimeout(() => {
          handleHide();
        }, timeoutDuration);
      }
    }, [mouseOver, handleHide, timeoutDuration, visible]);

    useEffect(() => {
      if (visible) {
        if (timeoutDuration && timeoutDuration > 0) {
          timeout.current = setTimeout(() => {
            handleHide();
          }, timeoutDuration);
        }
      }

      if (!visible) {
        clearTimeout(timeout.current);
      }

      return () => {
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
      };
    }, [visible, timeoutDuration, onHideCallback, handleHide]);

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '2.4rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
        onClick={handleHide}
        onMouseEnter={() => setMouseOver(true)}
        onMouseLeave={() => setMouseOver(false)}
      >
        <AnimatePresence>
          {visible && <Wrapped key={key} {...(rest as P)} />}
        </AnimatePresence>
      </div>
    );
  };

  return SelfDismissingNoteInner;
};

const containerVariants = {
  show: (delay = 0) => ({
    opacity: 1,
    y: '0%',
    transition: {
      when: 'beforeChildren',
      delay,
    },
  }),
  hide: {
    opacity: 0,
    y: '50%',
    transition: {
      when: 'afterChildren',
    },
  },
};

const wrapperVariants: Variants = {
  show: {
    width: '26rem',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
  hide: {
    width: '6rem',
    transition: {
      ease: 'easeIn',
    },
  },
};

export const MinNodesNotMet = SelfDismissingNote(
  ({ minNodes }: { minNodes: number }) => (
    <motion.div
      className="alter-limit-nudge"
      variants={containerVariants}
      initial="hide"
      animate="show"
      exit="hide"
      key="min-nodes-not-met"
    >
      <motion.div
        className="alter-limit-nudge__wrapper"
        variants={wrapperVariants}
      >
        <div className="alter-limit-nudge__icon">
          <Icon name="error" />
        </div>
        <motion.div className="alter-limit-nudge__content">
          <p>
            You must create at least <strong>{minNodes}</strong>{' '}
            {minNodes > 1 ? 'items' : 'item'} before you can continue.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  ),
);

export const MaxNodesMet = SelfDismissingNote(() => {
  const { updateReady } = useReadyForNextStage();

  useEffect(() => {
    updateReady(true);

    return () => {
      updateReady(false);
    };
  }, [updateReady]);

  return (
    <motion.div
      className="alter-limit-nudge"
      variants={containerVariants}
      initial="hide"
      animate="show"
      exit="hide"
      custom={FIRST_LOAD_UI_ELEMENT_DELAY}
      key="min-nodes-not-met"
    >
      <motion.div
        className="alter-limit-nudge__wrapper"
        variants={wrapperVariants}
      >
        <div className="alter-limit-nudge__icon">
          <Icon name="info" />
        </div>
        <motion.div className="alter-limit-nudge__content">
          <p>
            You have added the maximum number of items for this screen. Click
            the down arrow to continue.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

export const minNodesWithDefault = (stageValue?: number) =>
  defaultTo(stageValue, 0);
export const maxNodesWithDefault = (stageValue?: number) =>
  defaultTo(stageValue, Infinity);
