import { useEffect, useState } from 'react';
import ErrorDialog from '../ui/ErrorDialog';
import { CloseButton } from '../ui/CloseButton';
import { type ImportJob } from './JobReducer';
import { cn } from '~/utils/shadcn';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import Heading from '../ui/typography/Heading';
import Paragraph from '../ui/typography/Paragraph';

const JobCard = ({
  job,
  onCancel,
}: {
  job: ImportJob;
  onCancel: () => void;
}) => {
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
    <>
      {error && (
        <ErrorDialog
          open={showErrorDialog}
          onOpenChange={() => setShowErrorDialog(false)}
          title={error.title}
          description={error.description}
          additionalContent={error.additionalContent}
        />
      )}
      <div
        className={cn(
          'background-card relative flex gap-4 rounded-xl border bg-card p-4 shadow-xl shadow-primary/30',
          error && 'animate-wiggle border-destructive',
          isComplete && 'border-success',
        )}
        title={id}
      >
        <div className="flex basis-10 items-center justify-center">
          {!(isComplete || error) && (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
          {isComplete && <CheckCircle className="h-6 w-6 text-success" />}
          {error && <XCircle className="h-6 w-6 text-destructive" />}
        </div>

        <div className="w-72">
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
            {error && (
              <Button
                size="xs"
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
          </Paragraph>
        </div>
        <div className="flex items-center justify-center">
          <CloseButton onClick={onCancel} />
        </div>
      </div>
    </>
  );
};

export default JobCard;
