import { type AnyAction } from '@reduxjs/toolkit';
import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { actionCreators as dialogActions } from '~/lib/interviewer/ducks/modules/dialogs';
import { type AnonymisationStage } from '~/lib/protocol-validation/schemas/src/8.zod';
import { Markdown } from '~/lib/ui/components/Fields';
import EncryptionBackground from '../../../components/EncryptedBackground';
import { type StageProps } from '../../Stage';

type AnonymisationProps = StageProps & {
  stage: AnonymisationStage;
};

const THRESHOLD_POSITION = 25;

type Dialog = {
  id: string;
  type: 'Confirm' | 'Notice' | 'Warning' | 'Error';
  title: string;
  message: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export default function Anonymisation(props: AnonymisationProps) {
  const dispatch = useDispatch();
  const openDialog = (dialog: Dialog) =>
    dispatch(dialogActions.openDialog(dialog) as unknown as AnyAction);

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
          <h1 className="text-center">Protect Your Data</h1>
          {props.stage.items.map((item) => {
            console.log(item);

            return <Markdown key={item.id} label={item.content} />;
          })}
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div
          className="absolute z-10 w-full text-center text-[4rem] text-white/100 will-change-transform"
          style={{
            top: `${THRESHOLD_POSITION}%`,
            background:
              'linear-gradient(rgba(255,255, 255, 0) 40%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0) 60%)',
          }}
        >
          <div className="inline-flex h-28 w-28 animate-pulse items-center justify-center rounded-full bg-(--form-intro-panel-background)">
            🔒
          </div>
        </div>
        <EncryptionBackground thresholdPosition={THRESHOLD_POSITION} />
      </motion.div>
    </>
  );
}
