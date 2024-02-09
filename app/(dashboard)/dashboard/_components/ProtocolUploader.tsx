'use client';

import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/Button';
import { useProtocolImport } from '~/hooks/useProtocolImport';
import { FileUp, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';
import usePortal from 'react-useportal';
import { cn } from '~/utils/shadcn';
import JobCard from '~/components/ProtocolImport/JobCard';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';

function ProtocolUploader({
  handleProtocolUploaded,
}: {
  handleProtocolUploaded?: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { Portal } = usePortal();

  const { importProtocols, jobs, cancelJob, cancelAllJobs } = useProtocolImport(
    handleProtocolUploaded,
  );

  const { getInputProps, open } = useDropzone({
    // Disable automatic opening of file dialog - we do it manually to allow for
    // job cards to be clicked
    noClick: true,
    onDropAccepted: importProtocols,
    accept: {
      'application/octect-stream': ['.netcanvas'],
      'application/zip': ['.netcanvas'],
    },
  });

  const handleCancelJob = useCallback(
    (jobId: string) => () => cancelJob(jobId),
    [cancelJob],
  );

  const isActive = jobs && jobs.length > 0 && jobs.some((job) => !job.error);

  return (
    <>
      <Button
        onClick={open}
        className={cn(
          isActive &&
            cn(
              'bg-gradient-to-r from-cyber-grape via-neon-coral to-cyber-grape',
              'animate-background-gradient pointer-events-none cursor-wait bg-[length:400%]',
            ),
        )}
      >
        {isActive ? (
          <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="mr-2 inline-block h-4 w-4" />
        )}
        <input {...getInputProps()} />
        Import protocols
      </Button>
      {jobs.length > 0 && (
        <Button variant="outline" onClick={cancelAllJobs}>
          Cancel all
        </Button>
      )}
      <Portal>
        <motion.div layout className="text-md fixed bottom-4 right-6 w-[400px]">
          <motion.ul className="relative flex flex-col-reverse gap-2" layout>
            <AnimatePresence mode="popLayout">
              {jobs.map((job, index) => (
                <JobCard
                  layout
                  key={job.id}
                  job={job}
                  onCancel={handleCancelJob(job.id)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    transition: { delay: index * 0.5 },
                  }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </motion.div>
      </Portal>
    </>
  );
}

export default withNoSSRWrapper(ProtocolUploader);
