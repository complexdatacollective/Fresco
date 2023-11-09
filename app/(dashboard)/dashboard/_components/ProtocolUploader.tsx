'use client';

import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/Button';
import { useProtocolImport } from '~/hooks/useProtocolImport';
import { FileUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import JobCard from '~/components/ProtocolImport/JobCard';

const variants = {
  enter: {
    transition: { staggerChildren: 1, delayChildren: 0.2 },
  },
  exit: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

export default function ProtocolUploader() {
  const { importProtocols, jobs } = useProtocolImport();

  const { getRootProps, getInputProps } = useDropzone({
    onDropAccepted: async (acceptedFiles) => {
      await importProtocols(acceptedFiles);
    },
    accept: {
      'application/octect-stream': ['.netcanvas'],
      'application/zip': ['.netcanvas'],
    },
  });

  return (
    <>
      <motion.div className="text-md relative inline-block overflow-hidden rounded-xl border-2 border-dashed border-gray-500 bg-gray-200 p-6 leading-tight">
        <div {...getRootProps()}>
          <div className="text flex flex-col items-center gap-2 text-center">
            <Button variant="default">
              <FileUp className="mr-2 inline-block h-4 w-4" />
              <input {...getInputProps()} />
              Import protocol
            </Button>
            <p className="text-sm leading-tight">
              Click to select <code>.netcanvas</code> files or drag and drop
              here.
            </p>
          </div>
          <AnimatePresence>
            <div className="grid grid-cols-6 grid-rows-1 gap-6 overflow-x-auto rounded-xl bg-red-500 p-6 py-[20px]">
              {jobs.map((job, index) => (
                <JobCard job={job} key={job.id} delay={index * 0.05} />
              ))}
            </div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
