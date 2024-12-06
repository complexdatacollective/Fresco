import { motion } from 'motion/react';
import { type AnonymisationStage } from '~/lib/protocol-validation/schemas/src/8.zod';
import { Markdown } from '~/lib/ui/components/Fields';
import EncryptionBackground from '../../components/EncryptedBackground';
import { type StageProps } from '../Stage';

type AnonymisationProps = StageProps & {
  stage: AnonymisationStage;
};

export default function Anonymisation(props: AnonymisationProps) {
  console.log(props.stage.items);
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
        <EncryptionBackground />
      </motion.div>
    </>
  );
}
