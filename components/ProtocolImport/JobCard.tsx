import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorDialog from '../ui/ErrorDialog';
import { CloseButton } from '../ui/CloseButton';
import { type ImportJob } from './JobReducer';
import { cn } from '~/utils/shadcn';
import { Progress } from '../ui/progress';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import BackgroundBlobs from '../BackgroundBlobs/BackgroundBlobs';

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

const JobCard = ({
  job,
  onCancel,
}: {
  job: ImportJob;
  onCancel: () => void;
}) => {
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const { error, status, progress, id } = job;

  const isWaiting = !status;
  const isComplete = status === 'Complete';
  const isActive = !error && !isComplete && !isWaiting;

  // Self-dismiss when complete after 2 seconds
  useEffect(() => {
    if (isComplete) {
      const timeout = setTimeout(() => {
        onCancel();
      }, 2000);

      return () => {
        clearTimeout(timeout);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

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
          'relative inline-flex flex-shrink flex-grow gap-4 overflow-clip rounded-xl bg-gray-200 shadow-md transition-all',
          isActive && 'bg-primary/70 text-primary-foreground',
          error && ' bg-red-500 text-white',
          isComplete && 'bg-green-500 text-white',
        )}
        title={id}
        layout
      >
        {isActive && (
          <motion.div
            className={cn(`absolute inset-0 h-full w-full `)}
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 1 } : { opacity: 0 }}
            layout
          >
            <BackgroundBlobs
              large={5}
              medium={5}
              small={0}
              speedFactor={50}
              filter="blur(2rem)"
            />
          </motion.div>
        )}
        <motion.div
          className={cn(
            'relative z-10 m-2 flex min-w-0 flex-shrink flex-grow flex-row items-center justify-between gap-4 rounded-lg bg-transparent px-3 py-2 transition-all',
            isActive && 'bg-primary py-4 text-primary-foreground',
          )}
          layout
        >
          <motion.div
            className="flex min-w-0 flex-shrink flex-grow flex-row items-center justify-between gap-4"
            layout
          >
            <motion.div
              className="flex grow-0 items-center justify-center"
              layout
            >
              {!(isComplete || error) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isComplete && <CheckCircle className="h-4 w-4" />}
              {error && <XCircle className="h-4 w-4 " />}
            </motion.div>

            <motion.div
              layout
              className="flex min-w-0 flex-shrink flex-grow flex-col gap-1"
            >
              <motion.h1
                layout
                className={cn(
                  'bold min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-tight',
                  isActive && 'text-md',
                )}
              >
                {id}
              </motion.h1>
              <AnimatePresence mode="popLayout">
                {!error && status && (
                  <motion.div
                    className="flex w-full flex-col items-start gap-2"
                    key={status}
                    variants={statusVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                  >
                    <motion.p
                      className="text-xs leading-tight"
                      title={status}
                      layout
                    >
                      {status}
                    </motion.p>
                  </motion.div>
                )}
                {progress && (
                  <motion.div
                    className="flex w-full flex-col items-start gap-2"
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <Progress
                      className="h-2 bg-primary-foreground/30"
                      value={progress}
                      indicatorClasses={cn(
                        'bg-primary-foreground',
                        progress === 100 && 'bg-green-500',
                      )}
                    />
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex"
                    layout
                  >
                    <Button
                      size="xs"
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
          <CloseButton onClick={onCancel} className="grow-0" />
        </motion.div>
      </motion.div>
    </>
  );
};

export default JobCard;
