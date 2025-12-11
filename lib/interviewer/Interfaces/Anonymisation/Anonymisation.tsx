import type { Stage } from '@codaco/protocol-validation';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';
import z from 'zod';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Button from '~/components/ui/Button';
import { Field, Form, useFormState } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/InputField';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import EncryptionBackground from '../../components/EncryptedBackground';
import type { BeforeNextFunction } from '../../containers/ProtocolScreen';
import type { StageProps } from '../../containers/Stage';
import { usePassphrase } from './usePassphrase';

type AnonymisationProps = StageProps & {
  stage: Extract<Stage, { type: 'Anonymisation' }>;
};

export default function Anonymisation(props: AnonymisationProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { updateReady } = useReadyForNextStage();
  const {
    registerBeforeNext,
    stage: { explanationText, validation: passphraseValidation },
  } = props;
  const { passphrase, setPassphrase } = usePassphrase();

  const { isValid: isFormValid } = useFormState();

  const preventNavigationWithoutPassphrase: BeforeNextFunction = useCallback(
    (direction) => {
      // Allow backwards navigation always
      if (direction === 'backwards') {
        return true;
      }

      // Submit the form, to trigger validation
      formRef.current?.submit();

      if (!isFormValid) {
        return false;
      }

      return true;
    },
    [formRef, isFormValid],
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
          className="z-10 max-w-[80ch] rounded-(--nc-border-radius) bg-(--nc-panel-bg-muted) px-[2.4rem] py-[2.4rem]"
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
          <RenderMarkdown>{explanationText.body}</RenderMarkdown>
          <div className="mt-8 text-center">
            {passphrase && (
              <p className="my-10 text-xl font-bold">
                Passphrase created! Click the down arrow to continue.
              </p>
            )}
            {!passphrase && (
              <div>
                <Form onSubmit={handleSetPassphrase} ref={formRef}>
                  <Field
                    Component={InputField}
                    name="passphrase"
                    placeholder="Enter your passphrase..."
                    label="Passphrase"
                    validation={z.string().nonempty()}
                    autoFocus
                  />
                  <Field
                    Component={InputField}
                    name="passphrase-2"
                    placeholder="Re-enter your passphrase..."
                    label="Confirm Passphrase"
                    validation={({ formValues }) => {
                      const schema = z.string().nonempty();
                      const result = schema.safeParse(
                        formValues?.['passphrase-2'],
                      );
                      if (!result.success) {
                        return 'You must re-enter your passphrase';
                      }
                      if (
                        formValues?.passphrase !== formValues?.['passphrase-2']
                      ) {
                        return 'Passphrases do not match';
                      }
                      return undefined;
                    }}
                  />
                  <Button
                    key="submit"
                    aria-label="Submit"
                    type="submit"
                    icon="arrow-right"
                    iconPosition="right"
                  >
                    Continue
                  </Button>
                </Form>
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
