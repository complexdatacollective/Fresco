import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorDialog from '../ui/ErrorDialog';
import { CloseButton } from '../ui/CloseButton';
import { type ImportJob } from './JobReducer';
import { cn } from '~/utils/shadcn';
import { Progress } from '../ui/progress';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import BackgroundBlobs from '../BackgroundBlobs/BackgroundBlobs';
import { stat } from 'fs';

const statusVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

const iconVariants = {
  initial: {
    opacity: 0,
    x: -10,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 10,
  },
};

const JobCard = ({
  job,
  onCancel,
}: {
  job: ImportJob;
  onCancel: () => void;
}) => {
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const { error, status, id } = job;
  const { activeStep } = status;

  const isWaiting = activeStep === 'Waiting to begin';
  const isComplete = activeStep === 'Complete';
  const isActive = !error && !isComplete && !isWaiting;

  return (
    <>
      {error && (
        <ErrorDialog
          open={showErrorDialog}
          onOpenChange={() => setShowErrorDialog(false)}
          title={error?.title}
          description={error?.description}
          additionalContent={error?.additionalContent}
        />
      )}
      <motion.div
        className={cn(
          'relative inline-flex w-full gap-4 overflow-clip rounded-xl bg-gray-200 shadow-md transition-all',
          isActive && 'bg-primary text-primary-foreground',
          error && ' bg-red-500 text-white',
          isComplete && 'bg-green-500 text-white',
        )}
        title={id}
        layout
      >
        {/* {isActive && (
          <motion.div
            className={cn(`absolute inset-0 h-full w-full `)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <BackgroundBlobs
              large={3}
              medium={5}
              small={0}
              speedFactor={5}
              filter="blur(1rem)"
            />
          </motion.div>
        )} */}
        <motion.div
          className={cn(
            'relative z-10 m-2 flex w-full flex-row items-center justify-between gap-4 rounded-lg bg-transparent px-4 py-2 transition-all',
            isActive && 'bg-primary/70 py-3 text-primary-foreground',
            isComplete && 'py-3',
          )}
          layout
        >
          <motion.div
            className="flex flex-row items-center justify-between gap-4"
            layout
          >
            {!(isComplete || error) && (
              <Loader2 className="h-4 w-4 shrink-0 grow-0 animate-spin" />
            )}
            {isComplete && <CheckCircle className="h-4 w-4  shrink-0 grow-0" />}
            {error && <XCircle className="h-4 w-4 shrink-0  grow-0 " />}

            <motion.div layout className="flex flex-col gap-1">
              <motion.h1
                layout
                className={cn(
                  'bold text-md line-clamp-1 leading-tight',
                  isWaiting && 'text-sm',
                )}
              >
                {id}
              </motion.h1>
              <AnimatePresence mode="popLayout">
                {activeStep && (
                  <motion.div
                    className="flex w-full flex-col items-start gap-2"
                    key={activeStep}
                    variants={statusVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                  >
                    <p className="text-xs leading-tight" title={activeStep}>
                      {activeStep}
                    </p>
                    {status.progress && (
                      <motion.div
                        className="flex w-full flex-col items-start gap-2"
                        key="progress-bar"
                        variants={statusVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                      >
                        <Progress
                          value={status.progress}
                          indicatorClasses="bg-green-500"
                          className="w-full bg-white "
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    key="error"
                    variants={statusVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex shrink-0"
                  >
                    <Button
                      size="sm"
                      className="bg-red-500"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowErrorDialog(true);
                      }}
                    >
                      View error
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
          <CloseButton onClick={onCancel} className="shrink-0 grow-0" />
        </motion.div>
      </motion.div>
    </>
  );
};

export default JobCard;
