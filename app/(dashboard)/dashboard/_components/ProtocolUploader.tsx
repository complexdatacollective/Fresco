'use client';

import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/Button';
import { useProtocolImport } from '~/hooks/useProtocolImport';
import { FileUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import JobCard from '~/components/ProtocolImport/JobCard';
import { useCallback } from 'react';
import usePortal from 'react-useportal';
import Heading from '~/components/ui/typography/Heading';

export default function ProtocolUploader({
  handleProtocolUploaded,
}: {
  handleProtocolUploaded?: () => void;
}) {
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

  return (
    <>
      <Button variant="default" onClick={open} className="bg-sea-green">
        <FileUp className="mr-2 inline-block h-4 w-4" />
        <input {...getInputProps()} />
        Import protocols
      </Button>
      <Portal>
        <AnimatePresence>
          {jobs && jobs.length > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              layout
              className="text-md fixed bottom-10 right-10 inline-block max-w-sm overflow-hidden rounded-xl border-2 border-dashed border-sea-green bg-background p-6 leading-tight shadow-xl"
            >
              <Heading variant="h4">Importing protocols</Heading>
              {jobs && jobs.length > 0 && (
                <motion.ul className="relative mt-4 flex flex-col gap-2" layout>
                  <AnimatePresence mode="popLayout">
                    {jobs.map((job, index) => (
                      <motion.li
                        className="flex"
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          transition: { delay: index * 0.075 },
                        }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                        key={job.id}
                      >
                        <JobCard job={job} onCancel={handleCancelJob(job.id)} />
                      </motion.li>
                    ))}
                    {jobs.length > 1 && (
                      <motion.div className="flex justify-end" layout>
                        <Button
                          variant="link"
                          size="xs"
                          className="text-red-500"
                          onClick={cancelAllJobs}
                        >
                          Cancel all
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
