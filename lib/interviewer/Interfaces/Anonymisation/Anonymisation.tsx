import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';
import Surface, { MotionSurface } from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import { Alert, AlertDescription } from '~/components/ui/Alert';
import { ScrollArea } from '~/components/ui/ScrollArea';
import Field from '~/lib/form/components/Field/Field';
import PasswordField from '~/lib/form/components/fields/PasswordField';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import { useFormMeta } from '~/lib/form/hooks/useFormState';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import { useCelebrate } from '~/lib/interviewer/hooks/useCelebrate';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import type { StageProps } from '~/lib/interviewer/types';
import EncryptionBackground from '../../components/EncryptedBackground';
import { usePassphrase } from './usePassphrase';

type AnonymisationProps = StageProps<'Anonymisation'>;

function AnonymisationInner(props: AnonymisationProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const { updateReady } = useReadyForNextStage();
  const {
    stage: { explanationText },
  } = props;
  const { passphrase, setPassphrase } = usePassphrase();
  const celebrate = useCelebrate(alertRef);

  const { isValid: isFormValid } = useFormMeta();

  useEffect(() => {
    if (passphrase) {
      celebrate();
    }
  }, [passphrase, celebrate]);

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
      <EncryptionBackground thresholdPosition={passphrase ? 20 : 100} />
      <ScrollArea className="m-0 size-full">
        <div className="interface mx-auto min-h-full max-w-[80ch] flex-col">
          <MotionSurface
            noContainer
            className="bg-surface/80 max-w-2xl backdrop-blur-xs"
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
            <Heading level="h1">{explanationText.title}</Heading>
            <RenderMarkdown>{explanationText.body}</RenderMarkdown>

            <AnimatePresence mode="popLayout">
              {passphrase ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  <Alert ref={alertRef} variant="success">
                    <AlertDescription>
                      Passphrase set successfully! Click &quot;Next&quot; to
                      continue.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Surface level={1} className="mt-6" spacing="sm">
                    <FormWithoutProvider
                      onSubmit={handleSetPassphrase}
                      ref={formRef}
                    >
                      <Field
                        component={PasswordField}
                        name="passphrase"
                        placeholder="Enter your passphrase..."
                        label="Passphrase"
                        required
                        autoFocus
                      />
                      <Field
                        component={PasswordField}
                        name="passphrase-2"
                        placeholder="Re-enter your passphrase..."
                        label="Confirm Passphrase"
                        required
                        sameAs="passphrase"
                      />
                      <SubmitButton
                        key="submit"
                        aria-label="Submit"
                        type="submit"
                        icon={<ArrowRight />}
                        iconPosition="right"
                      >
                        Continue
                      </SubmitButton>
                    </FormWithoutProvider>
                  </Surface>
                </motion.div>
              )}
            </AnimatePresence>
          </MotionSurface>
        </div>
      </ScrollArea>
    </>
  );
}

export default function Anonymisation(props: AnonymisationProps) {
  return (
    <FormStoreProvider>
      <AnonymisationInner {...props} />
    </FormStoreProvider>
  );
}
