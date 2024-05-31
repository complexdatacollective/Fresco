'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FileDown, Loader2 } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JobCard from '~/components/ProtocolImport/JobCard';
import { Button } from '~/components/ui/Button';
import { PROTOCOL_EXTENSION } from '~/fresco.config';
import usePortal from '~/hooks/usePortal';
import { useProtocolImport } from '~/hooks/useProtocolImport';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { cn } from '~/utils/shadcn';

function ProtocolUploader() {
  const Portal = usePortal();

  const { importProtocols, jobs, cancelJob, cancelAllJobs } =
    useProtocolImport();

  const { getInputProps, open } = useDropzone({
    // Disable automatic opening of file dialog - we do it manually to allow for
    // job cards to be clicked
    noClick: true,
    onDropAccepted: importProtocols,
    accept: {
      'application/octect-stream': [PROTOCOL_EXTENSION],
      'application/zip': [PROTOCOL_EXTENSION],
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
              'pointer-events-none animate-background-gradient cursor-wait bg-[length:400%]',
            ),
        )}
      >
        {isActive ? (
          <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 inline-block h-4 w-4" />
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
        <motion.div
          layout
          className="text-md fixed bottom-4 right-6 z-10 w-[400px]"
        >
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
