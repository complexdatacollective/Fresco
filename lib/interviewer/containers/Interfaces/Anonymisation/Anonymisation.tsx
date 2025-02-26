import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import validations from '~/lib/interviewer/utils/Validations';
import type { AnonymisationStage } from '~/lib/protocol-validation/schemas/src/8.zod';
import type { VariableValidation } from '~/lib/shared-consts';
import { Button } from '~/lib/ui/components';
import { Markdown, Text } from '~/lib/ui/components/Fields';
import EncryptionBackground from '../../../components/EncryptedBackground';
import type { BeforeNextFunction } from '../../ProtocolScreen';
import type { StageProps } from '../../Stage';
import { usePassphrase } from './usePassphrase';

type ValidationKeys = keyof VariableValidation;

export const getValidationFunction = (validation: VariableValidation) => {
  const entries = Object.entries(validation) as [ValidationKeys, unknown][];

  const result = entries.map(([type, parameters]) => {
    if (Object.hasOwnProperty.call(validations, type)) {
      return validations[type as keyof typeof validations](parameters);
    }

    return () => `Validation "${type}" not found`;
  });

  // Return a function that executes each function in results in sequence, until one of the functions returns a string
  return (currentValue: unknown): string | undefined => {
    for (const fn of result) {
      const error = fn(currentValue) as string | undefined;
      if (error) {
        return error;
      }

      return undefined;
    }
  };
};

type AnonymisationProps = StageProps & {
  stage: AnonymisationStage;
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
  const { registerBeforeNext, stage } = props;
  const { passphrase, setPassphrase } = usePassphrase();

  const { passphraseValidation } = stage;

  const preventNavigationWithoutPassphrase: BeforeNextFunction = useCallback(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (direction) => {
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

  const validate = useMemo(
    () =>
      getValidationFunction({
        required: 'You must enter a passphrase',
        ...passphraseValidation,
      }),
    [passphraseValidation],
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
          // Reduce the spring effect
          transition={{
            type: 'spring',
            damping: 15,
            delay: 0.2,
          }}
        >
          <h1 className="mb-8 text-center text-balance">
            This interview provides advanced privacy protection
          </h1>
          {props.stage.items.map((item) => {
            return <Markdown key={item.id} label={item.content} />;
          })}
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
                      // validate
                      const isValid = validate(e.target.value);
                      console.log(isValid);

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
                        // validate
                        const isValid = validate(e.target.value);
                        console.log(isValid);

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
