import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ErrorDialog from '../ui/ErrorDialog';
import { CloseButton } from '../ui/CloseButton';
import type { ImportJob } from './JobReducer';
import { cn } from '~/utils/shadcn';
import { Progress } from '../ui/progress';
import { CheckCircle, Loader, Loader2, XCircle } from 'lucide-react';
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
  const finished = activeStepIndex === importSteps.length - 1;

  console.log('job', id, status);

  useEffect(() => {
    if (error) {
      setShowErrorDialog(true);
    }
  }, [error]);

  const getListItem = ({
    isActive,
    isFailed,
    isComplete,
  }: {
    isActive: boolean;
    isFailed: boolean;
    isComplete: boolean;
  }) => {
    if (isFailed) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    if (isComplete) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (isActive) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-900" />;
    }

    return <span className="h-4 w-4" />;
  };

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
        className={cn(
          'relative flex flex-col justify-center gap-4 rounded-xl border-2 bg-white p-8 text-center shadow-md',
          error && ' border-red-500',
          finished && 'border-green-500',
        )}
        variants={variants(delay)}
        initial="exit"
        animate="enter"
        exit="exit"
      >
        <CloseButton onClick={cancel} className="absolute right-4 top-4" />
        <h1 className="text-sm leading-tight">{id}</h1>
        {waiting ? (
          <div>
            <Loader2 className="h-4 w-4 animate-spin text-gray-900" />
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {importSteps.map((s) => {
              const isActive = s === status.activeStep;
              const isFailed = s === status.activeStep && error;
              const isComplete =
                activeStepIndex > importSteps.findIndex((step) => step === s);

              return (
                <li
                  key={s}
                  className={cn(
                    'flex gap-2 text-gray-500',
                    isActive || (isComplete && 'text-gray-900'),
                    isFailed && 'text-red-500',
                  )}
                >
                  {getListItem({ isActive, isFailed, isComplete })}
                  <span className="flex w-full flex-col items-start gap-1 text-xs leading-tight">
                    {s}
                    {status.progress && s === 'Uploading assets' && (
                      <Progress value={status.progress} className="w-full" />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {error && (
          <Button
            variant="destructive"
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
