'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { AnimatePresence, motion, useWillChange } from 'motion/react';
import { useEffect, useState } from 'react';
import { required } from '~/lib/interviewer/utils/Validations';
import { Button } from '~/lib/ui/components';
import Form from '../containers/Form';
import { usePassphrase } from '../containers/Interfaces/Anonymisation/usePassphrase';
import Overlay from '../containers/Overlay';

const transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export default function PassphrasePrompter() {
  const { setPassphrase, showPassphrasePrompter } = usePassphrase();
  const [showPassphraseOverlay, setShowPassphraseOverlay] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const willChange = useWillChange();

  const handleSetPassphrase = (passphrase: string) => {
    if (!passphrase) {
      return;
    }
    console.log('handleSetPassphrase', passphrase);
    setPassphrase(passphrase);
    setShowPassphraseOverlay(false);
  };

  console.log('show', showPassphrasePrompter);

  useEffect(() => {
    setTimeout(() => {
      setShowTooltip(true);
    }, 1000);
  }, []);

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
                    🔑
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
                className="bg-panel flex w-96 flex-col justify-center gap-4 rounded-xl p-6 shadow-xl"
              >
                <div>
                  Your passphrase is needed to show data on this screen. Click
                  here to enter it.
                </div>
                <Tooltip.Arrow className="fill-panel" height={10} width={20} />
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
  const formConfig = {
    formName: 'paassphrase',
    fields: [
      {
        label: null,
        name: 'passphrase',
        component: 'Text',
        placeholder: 'Enter your passphrase...',
        validate: [required('You must enter a value.')],
      },
    ],
  };

  const onSubmitForm = (fields) => {
    console.log(fields);
    handleSubmit(fields.passphrase);
  };

  return (
    <Overlay
      show={show}
      title="Enter your Passphrase"
      onClose={onClose}
      forceDisableFullscreen
      className="passphrase-form-overlay !max-w-[65ch]"
    >
      <div className="passphrase-form">
        <p>
          Enter your passphrase in order to unlock the data on this screen. If
          you cannot remember your passphrase, please contact the person who
          recruited you to this study.
        </p>
        <Form
          className="passphrase-form__form"
          form={formConfig.formName}
          subject={{ entity: 'ego' }}
          autoFocus
          onSubmit={onSubmitForm}
          {...formConfig} // eslint-disable-line react/jsx-props-no-spreading
        >
          <div
            className="passphrase-form__footer"
            style={{ marginBottom: '1.2rem' }}
          >
            <Button aria-label="Submit" type="submit">
              Submit passphrase
            </Button>
          </div>
        </Form>
      </div>
    </Overlay>
  );
};
