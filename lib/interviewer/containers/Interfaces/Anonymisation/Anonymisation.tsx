import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPassphrase } from '~/lib/interviewer/ducks/modules/session';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import { type RootState } from '~/lib/interviewer/store';
import { type AnonymisationStage } from '~/lib/protocol-validation/schemas/src/8.zod';
import { Button } from '~/lib/ui/components';
import { Markdown, Text } from '~/lib/ui/components/Fields';
import EncryptionBackground from '../../../components/EncryptedBackground';
import { type BeforeNextFunction } from '../../ProtocolScreen';
import { type StageProps } from '../../Stage';

type AnonymisationProps = StageProps & {
  stage: AnonymisationStage;
};

export default function Anonymisation(props: AnonymisationProps) {
  const [input, setInput] = useState('');
  const { updateReady } = useReadyForNextStage();
  const { registerBeforeNext } = props;
  const passphrase = useSelector(
    (state: RootState) => state.session.passphrase,
  );
  const dispatch = useDispatch();

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
    if (input && input.length > 0) {
      dispatch(setPassphrase(input));
      updateReady(true);
    }
  }, [dispatch, updateReady, input]);

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
                  input={{
                    name: 'passphrase',
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setInput(e.target.value),
                    value: input,
                  }}
                  placeholder="Enter a passphrase..."
                />
                <Button onClick={handleSetPassphrase}>Set Passphrase</Button>
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
        <EncryptionBackground thresholdPosition={passphrase ? 50 : 100} />
      </motion.div>
    </>
  );
}
