import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ErrorDialog from '../ui/ErrorDialog';
import { CloseButton } from '../ui/CloseButton';
import type { ImportJob } from './JobReducer';
import { cn } from '~/utils/shadcn';
import { Progress } from '../ui/progress';
import { CheckCircle, Loader, Loader2 } from 'lucide-react';
import { importSteps } from './JobProgressReducer';
import { Button } from '../ui/Button';

const variants = (delay: number) => ({
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      delay,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
  },
});

const JobCard = ({ job, delay }: { job: ImportJob; delay: number }) => {
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const { error, status, id, cancel } = job;

  const activeStepIndex = importSteps.findIndex(
    (step) => step === status.activeStep,
  );

  const waiting = activeStepIndex === -1;

  console.log('job', id, status);

  useEffect(() => {
    if (error) {
      setShowErrorDialog(true);
    }
  }, [error]);

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
        layout
        className="relative flex flex-col items-center justify-center rounded-xl bg-white p-6 text-center shadow-md"
        variants={variants(delay)}
        initial="exit"
        animate="enter"
        exit="exit"
      >
        <CloseButton onClick={cancel} className="absolute right-4 top-4" />
        <p>{id}</p>
        {waiting ? (
          <div>
            <Loader2 className="h-4 w-4 animate-spin text-gray-900" />
          </div>
        ) : (
          <ul>
            {importSteps.map((s) => {
              const isActive = s === status.activeStep;
              const isComplete =
                activeStepIndex > importSteps.findIndex((step) => step === s);

              return (
                <li
                  key={s}
                  className={cn(
                    'flex items-center gap-2 text-sm text-gray-500',
                    isActive && 'text-gray-900',
                  )}
                >
                  {isActive && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-900" />
                  )}
                  {isComplete && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span>{s}</span>
                  {status.progress &&
                    status.activeStep === 'Uploading assets' && (
                      <Progress value={status.progress} />
                    )}
                </li>
              );
            })}
          </ul>
        )}
        {error && (
          <Button
            variant="default"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowErrorDialog(true);
            }}
          >
            View error
          </Button>
        )}
      </motion.div>
    </>
  );
};

export default JobCard;
