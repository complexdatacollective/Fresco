'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import {
  AnimatePresence,
  motion,
  type Transition,
  useWillChange,
} from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import z from 'zod';
import Button from '~/components/ui/Button';
import { Field, Form } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/InputField';
import { usePassphrase } from '../Interfaces/Anonymisation/usePassphrase';
import Overlay from '../containers/Overlay';

const transition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  delay: 0.1,
};

export default function PassphrasePrompter() {
  const { setPassphrase, showPassphrasePrompter, passphraseInvalid } =
    usePassphrase();
  const [showPassphraseOverlay, setShowPassphraseOverlay] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const willChange = useWillChange();

  const handleSetPassphrase = useCallback(
    (passphrase: string) => {
      if (!passphrase) {
        return;
      }
      setPassphrase(passphrase);
      setShowPassphraseOverlay(false);
    },
    [setPassphrase],
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (passphraseInvalid) {
      timeout = setTimeout(() => {
        setShowTooltip(true);
      }, 500);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [passphraseInvalid]);

  return (
    <>
      <Tooltip.Provider>
        <Tooltip.Root open={showTooltip} onOpenChange={setShowTooltip}>
          <AnimatePresence>
            {showPassphrasePrompter && (
              <Tooltip.Trigger asChild>
                <motion.button
                  key="lock"
                  layout
                  className="bg-platinum group flex h-[4.8rem] w-[4.8rem] cursor-pointer items-center justify-center rounded-full"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={transition}
                  style={{ willChange }}
                  onClick={() => setShowPassphraseOverlay(true)}
                >
                  <motion.span className="animate-shake scale-90 text-4xl transition-transform group-hover:scale-100">
                    {passphraseInvalid ? '⚠️' : '🔑'}
                  </motion.span>
                </motion.button>
              </Tooltip.Trigger>
            )}
          </AnimatePresence>
          <Tooltip.Portal>
            <Tooltip.Content sideOffset={5} side="right" asChild>
              <motion.div
                key="tooltip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface flex w-96 flex-col justify-center gap-4 rounded-xl p-6 shadow-xl"
              >
                <div>
                  {passphraseInvalid
                    ? 'There was a problem decrypting the data. Please re-enter your passphrase.'
                    : 'Your passphrase is needed to show data on this screen. Click here to enter it.'}
                </div>
                <Tooltip.Arrow
                  className="fill-surface"
                  height={10}
                  width={20}
                />
              </motion.div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      <PassphraseOverlay
        handleSubmit={handleSetPassphrase}
        show={showPassphraseOverlay}
        onClose={() => setShowPassphraseOverlay(false)}
      />
    </>
  );
}

const PassphraseOverlay = ({
  handleSubmit,
  show,
  onClose,
}: {
  handleSubmit: (passphrase: string) => void;
  show: boolean;
  onClose: () => void;
}) => {
  const { passphraseInvalid } = usePassphrase();

  const onSubmitForm = (fields: { passphrase: string }) => {
    handleSubmit(fields.passphrase);
  };

  return (
    <Overlay show={show} title="Enter your Passphrase" onClose={onClose}>
      <div className="flex flex-col">
        {passphraseInvalid && (
          <p className="bg-accent/50 rounded p-6 text-white">
            There was an error decrypting the data with the passphrase entered.
            Please try again.
          </p>
        )}
        <p>
          Enter your passphrase in order to unlock the data on this screen. If
          you cannot remember your passphrase, please contact the person who
          recruited you to this study.
        </p>
        <Form className="mt-6" onSubmit={onSubmitForm}>
          <div className="mb-4 flex items-center justify-end">
            <Field
              Component={InputField}
              name="passphrase"
              label="Passphrase"
              placeholder="Enter your passphrase..."
              validation={z.string().nonempty()}
              autoFocus
            />
            <Button aria-label="Submit" type="submit">
              Submit passphrase
            </Button>
          </div>
        </Form>
      </div>
    </Overlay>
  );
};
