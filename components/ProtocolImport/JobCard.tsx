import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { forwardRef, useEffect, useState } from 'react';
import { cx } from '~/utils/cva';
import { Button } from '../ui/Button';
import { CloseButton } from '../ui/CloseButton';
import ErrorDialog from '../ui/ErrorDialog';
import Heading from '../ui/typography/Heading';
import Paragraph from '../ui/typography/Paragraph';
import { type ImportJob } from './JobReducer';

type JobCardProps = {
  job: ImportJob;
  onCancel: () => void;
};

const JobCard = forwardRef<HTMLLIElement, JobCardProps>(
  ({ job, onCancel }, ref) => {
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const { error, status, progress, id } = job;

    const isComplete = status === 'Complete';

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
    }, [isComplete, onCancel]);

    return (
      <li
        ref={ref}
        className={cx(
          'background-card bg-card shadow-primary/30 relative flex gap-4 rounded-xl border p-4 shadow-xl',
          error && 'animate-shake border-destructive',
          isComplete && 'border-success',
        )}
        title={id}
      >
        <motion.div
          className="flex basis-10 items-center justify-center"
          layout
        >
          {!(isComplete || error) && (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
          {isComplete && <CheckCircle className="text-success h-6 w-6" />}
          {error && <XCircle className="text-destructive h-6 w-6" />}
        </motion.div>
        <motion.div className="w-72" layout>
          <Heading
            className="text-md text-balance-['unset'] flex-1 truncate"
            variant="h4"
          >
            {id}
          </Heading>
          <Paragraph variant="smallText" key={status} title={status}>
            {!error
              ? `${status}...`
              : 'There was an error importing this protocol.'}
            {progress && `(${progress}%)`}
          </Paragraph>
          {error && (
            <Button
              size="sm"
              className="hover:bg-destructive-dark hover:text-destructive-foreground-dark bg-destructive text-destructive-foreground"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowErrorDialog(true);
              }}
            >
              Error details
            </Button>
          )}
        </motion.div>
        <motion.div className="flex items-center justify-center">
          <CloseButton onClick={onCancel} />
        </motion.div>
        {error && (
          <ErrorDialog
            open={showErrorDialog}
            onOpenChange={() => setShowErrorDialog(false)}
            title={error.title}
            description={error.description}
            additionalContent={error.additionalContent}
          />
        )}
      </li>
    );
  },
);

JobCard.displayName = 'JobCard';

export default motion(JobCard);
