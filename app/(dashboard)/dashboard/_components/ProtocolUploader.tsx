'use client';

import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/Button';
import ActiveProtocolSwitch from '~/app/(dashboard)/dashboard/_components/ActiveProtocolSwitch';
import ErrorDialog from '~/components/ui/ErrorDialog';
import { useToast } from '~/components/ui/use-toast';
import { Progress } from '~/components/ui/progress';
import { api } from '~/trpc/client';
import { clientRevalidateTag } from '~/utils/clientRevalidate';
import { useRouter } from 'next/navigation';
import { useProtocolImport } from '~/hooks/useProtocolImport';
import { FileUp, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const variants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function ProtocolUploader() {
  const { error, progress, reset, uploadProtocol } = useProtocolImport();

  const router = useRouter();
  const utils = api.useUtils();
  const { toast } = useToast();

  const { getRootProps, getInputProps } = useDropzone({
    disabled: !!progress,
    multiple: false,
    onDropAccepted: async (acceptedFiles) => {
      const file = acceptedFiles[0] as File;
      const { success } = await uploadProtocol(file);

      if (success) {
        toast({
          title: 'Protocol imported!',
          description: 'Your protocol has been successfully imported.',
          variant: 'success',
        });

        reset();
        await clientRevalidateTag('protocol.get.all');
        await utils.protocol.get.all.invalidate();
        router.refresh();
      }
    },
    accept: {
      'application/octect-stream': ['.netcanvas'],
      'application/zip': ['.netcanvas'],
    },
  });

  return (
    <>
      <ErrorDialog
        open={!!error}
        onOpenChange={reset}
        title={error?.title}
        description={error?.description}
        additionalContent={error?.additionalContent}
      />
      <div
        {...getRootProps()}
        className="text-md relative w-[320px] overflow-hidden rounded-xl border-2 border-dashed border-gray-500 bg-gray-200 p-6 leading-tight"
      >
        <AnimatePresence initial={false} mode="wait">
          {progress && (
            <motion.div
              className="flex w-full flex-col items-center gap-4"
              key="progress"
              variants={variants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <Loader2 className="mr-2 inline-block h-8 w-8 animate-spin" />
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={progress.status}
                      variants={variants}
                      initial="initial"
                      animate="enter"
                      exit="exit"
                      className="text-sm leading-tight"
                    >
                      {progress.status}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <Progress value={progress.percent} className="w-[200px]" />
              </div>
            </motion.div>
          )}

          {!progress && (
            <motion.div
              className="text flex flex-col items-center gap-2 text-center"
              key="initial"
              variants={variants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <Button variant="default">
                <FileUp className="mr-2 inline-block h-4 w-4" />
                <input {...getInputProps()} />
                Import protocol
              </Button>
              <p className="text-sm leading-tight">
                Click to select <code>.netcanvas</code> file or drag and drop
                here
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
