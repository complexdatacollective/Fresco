import type { Stage, Validation } from '@codaco/protocol-validation';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import { Button } from '~/lib/ui/components';
import { Markdown, Text } from '~/lib/ui/components/Fields';
import EncryptionBackground from '../../../components/EncryptedBackground';
import type { BeforeNextFunction } from '../../ProtocolScreen';
import type { StageProps } from '../../Stage';
import { usePassphrase } from './usePassphrase';

type AnonymisationProps = StageProps & {
  stage: Extract<Stage, { type: 'Anonymisation' }>;
};

type InputState = {
  touched: boolean;
  error: string | null;
  isValid: boolean;
  value: string;
};

export default function Anonymisation(props: AnonymisationProps) {
  const [input1, setInput1] = useState<InputState>({
    touched: false,
    error: null,
    isValid: false,
    value: '',
  });
  const [input2, setInput2] = useState<InputState>({
    touched: false,
    error: null,
    isValid: false,
    value: '',
  });

  const { updateReady } = useReadyForNextStage();
  const {
    registerBeforeNext,
    stage: { introductionPanel, validation },
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

  const handleSetPassphrase = useCallback(() => {
    if (input1.value === input2.value) {
      setPassphrase(input1.value);
      updateReady(true);
    }
  }, [input1, input2, setPassphrase, updateReady]);

  /**
   * Function for validating the passphrase.
   *
   * Passphrase is always required, and may optionally have a min and max length
   * specified in the protocol.
   */
  const validate = useCallback(
    (value: string) => {
      const stuff: Validation = {
        required: true,
        ...validation,
      };

      // TODO
      return false;
    },
    [validation],
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
            {introductionPanel.title}
          </h1>
          <Markdown label={introductionPanel.text} />
          <div className="mt-8 text-center">
            {passphrase && (
              <p className="my-10 text-xl font-bold">
                Passphrase created! Click the down arrow to continue.
              </p>
            )}
            {!passphrase && (
              <div>
                <Text
                  autoFocus
                  type="password"
                  input={{
                    name: 'passphrase-1',
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const isValid = validate(e.target.value);
                      setInput1({
                        ...input1,
                        value: e.target.value,
                        error: isValid ?? '',
                        isValid: !isValid,
                      });
                    },
                    onBlur: () => {
                      setInput1({
                        ...input1,
                        touched: true,
                      });
                    },
                    value: input1.value,
                  }}
                  meta={{
                    error: input1.error,
                    invalid: !input1.isValid,
                    touched: input1.touched,
                  }}
                  placeholder="Enter a passphrase..."
                  adornmentRight={
                    input1.isValid && <Check className="text-success" />
                  }
                />
                {input1.isValid && input1.value.length > 0 && (
                  <Text
                    type="password"
                    input={{
                      name: 'passphrase-2',
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const isValid = validate(e.target.value);

                        if (input1.value !== e.target.value) {
                          setInput2({
                            ...input2,
                            value: e.target.value,
                            error: 'Passphrases do not match',
                            isValid: false,
                          });

                          return;
                        }

                        setInput2({
                          ...input2,
                          value: e.target.value,
                          error: isValid ?? '',
                          isValid: !isValid,
                        });
                      },
                      onBlur: () => {
                        setInput2({
                          ...input2,
                          touched: true,
                        });
                      },
                      value: input2.value,
                    }}
                    meta={{
                      error: input2.error,
                      invalid: !input2.isValid,
                      touched: input2.touched,
                    }}
                    placeholder="Enter a passphrase..."
                    adornmentRight={
                      input2.isValid && <Check className="text-success" />
                    }
                  />
                )}
                <div className="w-full text-right">
                  <Button
                    onClick={handleSetPassphrase}
                    disabled={!input1.isValid || !input2.isValid}
                  >
                    Set Passphrase
                  </Button>
                </div>
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
