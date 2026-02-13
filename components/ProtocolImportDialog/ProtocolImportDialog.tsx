'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { FileDown, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import Modal from '~/components/Modal/Modal';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
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
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.div layout ref={ref} {...props}>
        {children}
      </motion.div>
    );
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

  const stats = useMemo(() => {
    const total = jobsArray.length;
    const completed = jobsArray.filter((j) => j.phase === 'complete').length;
    const failed = jobsArray.filter((j) => j.phase === 'error').length;
    const active = total - completed - failed;
    return { total, completed, failed, active };
  }, [jobsArray]);

  const hasJobs = jobsArray.length > 0;
  const hasCompletedOrErrorJobs = stats.completed > 0 || stats.failed > 0;

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
        <DialogPopup className="flex max-h-[80vh] min-h-[400px] w-full max-w-lg flex-col">
          {/* Header */}
          <BaseDialog.Title
            render={(props) => (
              <DialogHeading {...props}>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
                      <FileDown className="text-primary h-7 w-7" />
                    </div>
                    <div>
                      <Heading level="h3" margin="none">
                        Protocol Import
                      </Heading>
                      {hasJobs && (
                        <Paragraph
                          margin="none"
                          emphasis="muted"
                          className="mt-1"
                        >
                          {stats.active > 0 && (
                            <span>
                              {stats.active} importing
                              {stats.completed > 0 &&
                                `, ${stats.completed} complete`}
                              {stats.failed > 0 && `, ${stats.failed} failed`}
                            </span>
                          )}
                          {stats.active === 0 && stats.completed > 0 && (
                            <span>
                              {stats.completed} complete
                              {stats.failed > 0 && `, ${stats.failed} failed`}
                            </span>
                          )}
                          {stats.active === 0 &&
                            stats.completed === 0 &&
                            stats.failed > 0 && (
                              <span>{stats.failed} failed</span>
                            )}
                        </Paragraph>
                      )}
                    </div>
                  </div>
                  <BaseDialog.Close nativeButton render={<CloseButton />} />
                </div>
              </DialogHeading>
            )}
          />

          {/* Content */}
          <ScrollArea className="-mx-6 flex-1 px-6" fade>
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="bg-surface-contrast/5 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                    <FileDown className="text-surface-contrast/30 h-10 w-10" />
                  </div>
                  <Heading level="h4" margin="none">
                    No imports in progress
                  </Heading>
                  <Paragraph emphasis="muted" margin="none" className="mt-2">
                    Select protocol files to begin importing.
                  </Paragraph>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Footer */}
          {hasCompletedOrErrorJobs && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cx(
                'border-surface-contrast/10 -mx-6 mt-6 flex justify-end gap-3 border-t px-6 pt-6',
              )}
            >
              <Button
                variant="outline"
                onClick={clearCompletedJobs}
                icon={<Trash2 className="size-4" />}
              >
                Clear completed
              </Button>
            </motion.div>
          )}
        </DialogPopup>
      </Modal>

      {/* Confirmation dialog for closing with active jobs */}
      <Modal open={showConfirmClose} onOpenChange={handleCancelClose}>
        <DialogPopup>
          <BaseDialog.Title
            render={(props) => (
              <DialogHeading {...props}>
                <Heading level="h3" margin="none">
                  Cancel Imports?
                </Heading>
              </DialogHeading>
            )}
          />
          <Alert variant="warning" className="my-6">
            <AlertTitle>Active imports in progress</AlertTitle>
            <AlertDescription>
              Closing this dialog will not cancel the active imports, but you
              will lose visibility into their progress.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancelClose}>
              Keep open
            </Button>
            <Button color="destructive" onClick={handleConfirmClose}>
              Close anyway
            </Button>
          </div>
        </DialogPopup>
      </Modal>
    </>
  );
}
