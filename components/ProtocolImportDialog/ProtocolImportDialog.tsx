'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, useCallback, useState } from 'react';
import Modal from '~/components/Modal/Modal';
import { headingVariants } from '~/components/typography/Heading';
import CloseButton from '~/components/ui/CloseButton';
import { ScrollArea } from '~/components/ui/ScrollArea';
import DialogPopup from '~/lib/dialogs/DialogPopup';
import { type ImportJob } from '~/lib/protocol-import/protocolImportStore';
import { useProtocolImportStore } from '~/lib/protocol-import/useProtocolImportStore';
import { cx } from '~/utils/cva';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Button } from '../ui/Button';
import ImportJobItem from './ImportJobItem';

type DialogHeadingProps = React.HTMLAttributes<HTMLHeadingElement>;

const DialogHeading = forwardRef<HTMLHeadingElement, DialogHeadingProps>(
  (
    {
      className,
      onAnimationStart: _onAnimationStart,
      onAnimationEnd: _onAnimationEnd,
      onDrag: _onDrag,
      onDragEnd: _onDragEnd,
      onDragEnter: _onDragEnter,
      onDragExit: _onDragExit,
      onDragLeave: _onDragLeave,
      onDragOver: _onDragOver,
      onDragStart: _onDragStart,
      onDrop: _onDrop,
      ...props
    },
    ref,
  ) => {
    return <motion.h2 layout className={className} ref={ref} {...props} />;
  },
);

DialogHeading.displayName = 'DialogHeading';

export default function ProtocolImportDialog() {
  const isDialogOpen = useProtocolImportStore((s) => s.isDialogOpen);
  const closeDialog = useProtocolImportStore((s) => s.closeDialog);
  const jobs = useProtocolImportStore((s) => s.jobs);
  const removeJob = useProtocolImportStore((s) => s.removeJob);
  const clearCompletedJobs = useProtocolImportStore(
    (s) => s.clearCompletedJobs,
  );
  const hasActiveJobs = useProtocolImportStore((s) => s.hasActiveJobs);

  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const jobsArray = Array.from(jobs.values());
  const hasJobs = jobsArray.length > 0;
  const hasCompletedOrErrorJobs = jobsArray.some(
    (job) => job.phase === 'complete' || job.phase === 'error',
  );

  const handleCloseAttempt = useCallback(() => {
    if (hasActiveJobs()) {
      setShowConfirmClose(true);
    } else {
      closeDialog();
    }
  }, [hasActiveJobs, closeDialog]);

  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    closeDialog();
  }, [closeDialog]);

  const handleCancelClose = useCallback(() => {
    setShowConfirmClose(false);
  }, []);

  const handleRetry = useCallback(
    (job: ImportJob) => {
      removeJob(job.id);
      const event = new CustomEvent('protocol-import-retry', {
        detail: { file: job.file },
      });
      window.dispatchEvent(event);
    },
    [removeJob],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      removeJob(id);
    },
    [removeJob],
  );

  return (
    <>
      <Modal open={isDialogOpen} onOpenChange={handleCloseAttempt}>
        <DialogPopup className="min-h-[300px]">
          <BaseDialog.Title
            render={(props) => (
              <DialogHeading
                className={cx(
                  headingVariants({ level: 'h4' }),
                  'flex items-center justify-between gap-2',
                )}
                {...props}
              >
                Protocol Import
                <BaseDialog.Close render={<CloseButton />} />
              </DialogHeading>
            )}
          />
          <ScrollArea className="flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {hasJobs ? (
                jobsArray.map((job) => (
                  <ImportJobItem
                    key={job.id}
                    job={job}
                    onRetry={handleRetry}
                    onDismiss={handleDismiss}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-surface-contrast/50 flex flex-col items-center justify-center py-8 text-center"
                >
                  <p>No imports in progress.</p>
                  <p className="text-sm">
                    Select protocol files to begin importing.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
          {hasCompletedOrErrorJobs && (
            <motion.footer
              layout
              className="mt-4 flex justify-end gap-2 border-t pt-4"
            >
              <Button variant="outline" size="sm" onClick={clearCompletedJobs}>
                Clear completed
              </Button>
            </motion.footer>
          )}
        </DialogPopup>
      </Modal>

      <Modal open={showConfirmClose} onOpenChange={handleCancelClose}>
        <DialogPopup>
          <BaseDialog.Title
            render={(props) => (
              <DialogHeading
                className={headingVariants({ level: 'h4' })}
                {...props}
              >
                Cancel Imports?
              </DialogHeading>
            )}
          />
          <Alert variant="warning" className="my-4">
            <AlertTitle>Active imports in progress</AlertTitle>
            <AlertDescription>
              Closing this dialog will not cancel the active imports, but you
              will lose visibility into their progress.
            </AlertDescription>
          </Alert>
          <motion.footer
            layout
            className="mt-4 flex justify-end gap-2 border-t pt-4"
          >
            <Button variant="outline" onClick={handleCancelClose}>
              Keep open
            </Button>
            <Button color="destructive" onClick={handleConfirmClose}>
              Close anyway
            </Button>
          </motion.footer>
        </DialogPopup>
      </Modal>
    </>
  );
}
