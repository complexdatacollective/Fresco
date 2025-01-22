'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import {
  AnimatePresence,
  motion,
  useWillChange,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';
import { useToggle } from 'usehooks-ts';
import { Button } from '~/lib/ui/components';

const variants: Variants = {};
const transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export default function PassphrasePrompter() {
  const [show, setShow] = useState(false);
  const [expanded, toggleExpanded, setExpanded] = useToggle(false);

  const willChange = useWillChange();

  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 1000);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="passphrase-prompter"
          className="bg-panel grid place-items-center overflow-hidden"
          layout
          initial={{ opacity: 0, scale: 0 }}
          exit={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            width: expanded ? 400 : '4.8rem',
            height: expanded ? 140 : '4.8rem',
            borderRadius: expanded ? 80 : 500,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 30,
              when: 'afterChildren',
            },
          }}
          style={{ willChange }}
        >
          <PanelContent expanded={expanded} toggleExpanded={toggleExpanded} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PanelContent({
  expanded,
  toggleExpanded,
}: {
  expanded: boolean;
  toggleExpanded: () => void;
}) {
  const willChange = useWillChange();
  return (
    <AnimatePresence mode="wait">
      {expanded && (
        <motion.div
          key="passphrase"
          layout
          className="grid place-items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleExpanded();
          }}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 15, opacity: 0 }}
          transition={transition}
          style={{ willChange }}
        >
          <motion.div className="text-2xl">Enter passphrase</motion.div>
          <motion.input
            className="h-12 w-2/3 rounded-md text-center text-2xl"
            type="password"
          />
        </motion.div>
      )}
      {!expanded && <UnlockButton toggleExpanded={toggleExpanded} />}
    </AnimatePresence>
  );
}

const UnlockButton = ({ toggleExpanded }) => {
  const [showTooltip, setShowTooltip] = useState(true);
  const willChange = useWillChange();
  return (
    <Tooltip.Provider>
      <Tooltip.Root open={showTooltip} delayDuration={1500}>
        <Tooltip.Trigger asChild>
          <motion.button
            key="lock"
            layout
            className="flex h-full w-full items-center justify-center"
            onClick={(e) => {
              console.log('🔒');
              e.preventDefault();
              e.stopPropagation();
              toggleExpanded();
            }}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 15, opacity: 0 }}
            transition={transition}
            style={{ willChange }}
          >
            <motion.span className="animate-shake text-4xl">🔑</motion.span>
          </motion.button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            className="data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade bg-panel z-20 flex flex-col gap-6 rounded-xl px-6 py-4 leading-none shadow-md will-change-[transform,opacity] select-none"
            sideOffset={5}
          >
            <div>Your passphrase is needed to show data on this screen.</div>
            <div className="flex gap-4">
              <Button size="small">Enter Passphrase</Button>
              <Button size="small" onClick={() => setShowTooltip(false)}>
                Dismiss Message
              </Button>
            </div>
            <Tooltip.Arrow className="fill-white" height={10} width={20} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
