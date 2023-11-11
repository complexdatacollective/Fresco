'use client';

import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/Button';
import { useProtocolImport } from '~/hooks/useProtocolImport';
import { FileUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import JobCard from '~/components/ProtocolImport/JobCard';

export default function ProtocolUploader() {
  const { importProtocols, jobs, cancelJob } = useProtocolImport();

  const { getRootProps, getInputProps, open } = useDropzone({
    // Disable automatic opening of file dialog - we do it manually to allow for
    // job cards to be clicked
    noClick: true,
    onDropAccepted: importProtocols,
    accept: {
      'application/octect-stream': ['.netcanvas'],
      'application/zip': ['.netcanvas'],
    },
  });

  return (
    <>
      <motion.div
        layout
        className="text-md inline-block max-w-sm overflow-hidden rounded-xl border-2 border-dashed border-gray-500 p-6 leading-tight"
      >
        <motion.div {...getRootProps()} layout>
          <motion.div
            className="text flex flex-col items-center gap-2 text-center"
            layout
          >
            <Button variant="default" onClick={open}>
              <FileUp className="mr-2 inline-block h-4 w-4" />
              <input {...getInputProps()} />
              Import protocol
            </Button>
            <p className="text-sm leading-tight">
              Click to select <code>.netcanvas</code> files or drag and drop
              here.
            </p>
          </motion.div>
          {jobs && jobs.length > 0 && (
            <motion.ul className="relative mt-4 flex flex-col gap-2" layout>
              <AnimatePresence mode="popLayout">
                {jobs.map((job, index) => (
                  <motion.li
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
                    <JobCard job={job} onCancel={() => cancelJob(job.id)} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
