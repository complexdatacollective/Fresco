import type { Stage } from '@codaco/protocol-validation';
import { motion } from 'motion/react';
import { useCallback, useEffect } from 'react';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import { Markdown } from '~/lib/ui/components/Fields';
import EncryptionBackground from '../../../components/EncryptedBackground';
import Form from '../../Form';
import type { BeforeNextFunction } from '../../ProtocolScreen';
import type { StageProps } from '../../Stage';
import { usePassphrase } from './usePassphrase';

type AnonymisationProps = StageProps & {
  stage: Extract<Stage, { type: 'Anonymisation' }>;
};

export default function Anonymisation(props: AnonymisationProps) {
  const { updateReady } = useReadyForNextStage();
  const {
    registerBeforeNext,
    stage: { explanationText, validation: passphraseValidation },
  } = props;
  const { passphrase, setPassphrase } = usePassphrase();

  const preventNavigationWithoutPassphrase: BeforeNextFunction = useCallback(
    (direction) => {
      // Allow backwards navigation always
      if (direction === 'backwards') {
        return true;
      }

      if (!passphrase) {
        return false;
      }

      return true;
    },
    [passphrase],
  );

  useEffect(() => {
    registerBeforeNext(preventNavigationWithoutPassphrase);
  }, [registerBeforeNext, preventNavigationWithoutPassphrase]);

  const handleSetPassphrase = useCallback(
    (fields: { passphrase: string }) => {
      setPassphrase(fields.passphrase);
      updateReady(true);
    },
    [setPassphrase, updateReady],
  );

  return (
    <>
      <motion.div className="anonymisation flex h-full w-full flex-col items-center justify-center">
        <motion.div
          className="z-10 max-w-[80ch] rounded-(--nc-border-radius) bg-(--form-intro-panel-background) px-[2.4rem] py-[2.4rem]"
          initial={{
            scale: 0.8,
            opacity: 0,
            y: 50,
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
          }}
          transition={{
            type: 'spring',
            damping: 15,
            delay: 0.2,
          }}
        >
          <h1 className="mb-8 text-center text-balance">
            {explanationText.title}
          </h1>
          <Markdown label={explanationText.body} />
          <div className="mt-8 text-center">
            {passphrase && (
              <p className="my-10 text-xl font-bold">
                Passphrase created! Click the down arrow to continue.
              </p>
            )}
            {!passphrase && (
              <div>
                <Form
                  form="passphrase"
                  onSubmit={handleSetPassphrase}
                  subject={{ entity: 'ego' }}
                  autoFocus
                  fields={[
                    {
                      label: null,
                      name: 'passphrase',
                      component: 'Text',
                      placeholder: 'Enter your passphrase...',
                      validation: {
                        required: true,
                        ...passphraseValidation,
                      },
                    },
                    {
                      label: null,
                      name: 'passphrase-2',
                      component: 'Text',
                      placeholder: 'Re-enter your passphrase...',
                      validation: {
                        required: true,
                        sameAs: 'passphrase',
                        ...passphraseValidation,
                      },
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <EncryptionBackground thresholdPosition={passphrase ? 20 : 100} />
      </motion.div>
    </>
  );
}
