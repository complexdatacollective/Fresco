import { useState } from 'react';
import { FileCheck, FileText, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  useDropzone,
  type FileRejection,
  type DropzoneOptions,
} from 'react-dropzone';
import { Label } from '~/components/ui/Label';
import { cn } from '~/utils/shadcn';
import parseCSV from '~/utils/parseCSV';
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '~/components/ui/form';
import type { Control } from 'react-hook-form';

export const DropzoneField = ({
  label,
  description,
  control,
  error,
}: {
  label: string;
  description: string;
  control: Control<{
    csvFile: Record<string, string>[] | null;
    csvColumn?: string | undefined;
  }>;
  error?: string;
}) => (
  <FormField
    control={control}
    name="csvFile"
    defaultValue={null}
    rules={{ required: false }}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormDescription>{description}</FormDescription>
        <Dropzone value={field.value} onChange={field.onChange} error={error} />
      </FormItem>
    )}
  />
);

export const Dropzone = ({
  id,
  name,
  label,
  hint,
  onChange,
  value,
  accept = {
    'text/csv': [],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
    'application/vnd.ms-excel': [],
  },
  maxFiles = 1,
  maxSize = 1024 * 5000, // 5MB
  error,
}: {
  id?: string;
  name?: string;
  label?: string;
  hint?: string;
  onChange: (csvData: Record<string, string>[]) => void;
  value: Record<string, string>[] | null;
  accept?: DropzoneOptions['accept'];
  maxFiles?: DropzoneOptions['maxFiles'];
  maxSize?: DropzoneOptions['maxSize'];
  error?: string;
}) => {
  const [processing, setProcessing] = useState(false);

  const onDrop = async (
    acceptedFiles: File[],
    _fileRejections: FileRejection[],
  ) => {
    if (acceptedFiles?.length && acceptedFiles[0]) {
      setProcessing(true);
      const csvData = await parseCSV(acceptedFiles[0]);
      // Add small artificial delay for animation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProcessing(false);
      onChange(csvData);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: false,
    maxFiles,
    maxSize,
    onDrop: (acceptedFiles, fileRejections) =>
      void onDrop(acceptedFiles, fileRejections),
  });

  const componentId = id ?? name;

  const variants = {
    show: { opacity: 1, y: 0 },
    hide: { opacity: 0, y: 10 },
  };

  return (
    <div className="relative grid w-full items-center gap-1.5 overflow-hidden">
      {label && <Label htmlFor={componentId}>{label}</Label>}
      {hint && (
        <span className="mb-4 text-sm leading-5 text-muted-foreground">
          {hint}
        </span>
      )}

      <div
        {...getRootProps({
          className: cn(
            'relative mx-auto flex w-full cursor-pointer flex-col items-center justify-center border border-dashed border-neutral-300 h-[6rem] transition-colors hover:border-violet-800 border-2 rounded-xl',
          ),
        })}
      >
        <input {...getInputProps({ id: componentId })} />
        <AnimatePresence mode="wait" initial={false}>
          {processing && (
            <motion.div
              className="flex flex-col items-center justify-center gap-2"
              key="processing"
              variants={variants}
              initial="hide"
              animate="show"
              exit="hide"
            >
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Processing...</span>
            </motion.div>
          )}
          {!value && !processing && (
            <motion.div
              key="no-value"
              variants={variants}
              initial="hide"
              animate="show"
              exit="hide"
              className="flex flex-col items-center justify-center gap-2"
            >
              <FileText className="text-violet-800" size={28} />
              {isDragActive ? (
                <p className="text-sm">Drop file here...</p>
              ) : (
                <p className="text-sm">
                  Drag & drop file here, or click to select.
                </p>
              )}
            </motion.div>
          )}
          {value && !processing && (
            <motion.div
              key="value"
              variants={variants}
              initial="hide"
              animate="show"
              exit="hide"
              className="flex flex-col items-center justify-center gap-2"
            >
              <FileCheck className="text-green-600" size={28} />
              <p className="text-sm">
                Valid file uploaded. Click the button to continue, or drop a new
                file here to replace.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
};
