import { motion } from 'motion/react';
import { useCallback, useRef } from 'react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Button from '~/components/ui/Button';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import Form from '~/lib/form/components/Form';
import useFormState from '~/lib/form/hooks/useFormState';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import type { StageProps } from '~/lib/interviewer/types';
import EncryptionBackground from '../../components/EncryptedBackground';
import { usePassphrase } from './usePassphrase';

type AnonymisationProps = StageProps<'Anonymisation'>;

export default function Anonymisation(props: AnonymisationProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { updateReady } = useReadyForNextStage();
  const {
    stage: { explanationText },
  } = props;
  const { passphrase, setPassphrase } = usePassphrase();

  const { isValid: isFormValid } = useFormState();

  useBeforeNext((direction) => {
    if (direction === 'backwards') {
      return true;
    }

    formRef.current?.submit();

    if (!isFormValid) {
      return false;
    }

    return true;
  });

  const handleSetPassphrase = useCallback(
    (values: unknown) => {
      const fields = values as { passphrase: string };
      setPassphrase(fields.passphrase);
      updateReady(true);
      return { success: true };
    },
    [setPassphrase, updateReady],
  );

  return (
    <>
      <motion.div className="anonymisation flex size-full flex-col items-center justify-center">
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
                Passphrase created! Click the next arrow to continue.
              </p>
            )}
            {!passphrase && (
              <div>
                <Form onSubmit={handleSetPassphrase} ref={formRef}>
                  <Field
                    component={InputField}
                    name="passphrase"
                    placeholder="Enter your passphrase..."
                    label="Passphrase"
                    required
                    autoFocus
                  />
                  <Field
                    component={InputField}
                    name="passphrase-2"
                    placeholder="Re-enter your passphrase..."
                    label="Confirm Passphrase"
                    required
                    sameAs="passphrase"
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
