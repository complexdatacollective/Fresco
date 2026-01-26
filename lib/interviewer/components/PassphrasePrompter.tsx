'use client';

import { Tooltip } from '@base-ui/react/tooltip';
import {
  AnimatePresence,
  motion,
  type Transition,
  useWillChange,
} from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import Button from '~/components/ui/Button';
import Field from '~/lib/form/components/Field/Field';
import Form from '~/lib/form/components/Form';
import InputField from '~/lib/form/components/fields/InputField';
import { usePassphrase } from '../Interfaces/Anonymisation/usePassphrase';
import Overlay from './Overlay';

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
              <Tooltip.Trigger
                render={
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
                }
              />
            )}
          </AnimatePresence>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={5} side="right">
              <Tooltip.Popup
                render={
                  <motion.div
                    key="tooltip"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-surface flex w-96 flex-col justify-center gap-4 rounded-xl p-6 shadow-xl"
                  />
                }
              >
                <div>
                  {passphraseInvalid
                    ? 'There was a problem decrypting the data. Please re-enter your passphrase.'
                    : 'Your passphrase is needed to show data on this screen. Click here to enter it.'}
                </div>
                <Tooltip.Arrow className="fill-surface" />
              </Tooltip.Popup>
            </Tooltip.Positioner>
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

  const onSubmitForm = (values: unknown) => {
    const fields = values as { passphrase: string };
    handleSubmit(fields.passphrase);
    return { success: true };
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
              component={InputField}
              name="passphrase"
              label="Passphrase"
              placeholder="Enter your passphrase..."
              required
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
