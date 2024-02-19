import { useController, type Control } from 'react-hook-form';
import parseCSV from '~/utils/parseCSV';
import { useDropzone } from 'react-dropzone';
import { cn } from '~/utils/shadcn';
import { useId } from 'react';
import { Label } from '~/components/ui/Label';
import { type FormSchema } from './ImportCSVModal';
import { isArray } from 'lodash';
import Paragraph from '~/components/ui/typography/Paragraph';
import { FileCheck, FileText } from 'lucide-react';

const accept = {
  'text/csv': [],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
  'application/vnd.ms-excel': [],
};
const maxFiles = 1;
const maxSize = 1024 * 5000; // 5MB

export default function DropzoneField<T>({
  control,
  name,
  label,
  hint,
}: {
  control: Control<FormSchema>;
  name: 'csvFile';
  label?: string;
  hint?: string;
}) {
  const id = useId();

  const controller = useController<FormSchema>({
    name,
    control,
    rules: {
      required: 'No CSV file selected. Please select a file.',
      validate: {
        hasCorrectFields: (value) => {
          if (!value) {
            return 'No CSV file selected. Please select a file.';
          }

          if (!isArray(value)) {
            return 'Invalid CSV. Please select a valid CSV file.';
          }

          // Check that every row has either a label or an identifier
          const valid = value.every((row) => row.label ?? row.identifier);

          if (!valid) {
            return 'Invalid CSV. Every row must have either a label or an identifier';
          }
        },
      },
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept,
    multiple: false,
    maxFiles,
    maxSize,
    onDrop: async (acceptedFiles, _fileRejections) => {
      if (acceptedFiles?.length && acceptedFiles[0]) {
        const csvData = await parseCSV<T>(acceptedFiles[0]);
        controller.field.onChange(csvData);
      }
    },
  });

  return (
    <div className="relative grid w-full items-center gap-1.5 overflow-hidden">
      {label && (
        <Label htmlFor={id} required>
          {label}
        </Label>
      )}
      {hint && (
        <span className="text-sm leading-5 text-muted-foreground">{hint}</span>
      )}
      <div
        ref={controller.field.ref}
        {...getRootProps({
          className: cn(
            'w-full relative mx-auto flex cursor-pointer flex-col items-center justify-center border border-dashed transition-colors hover:border-primary border-2 rounded-xl p-4',
          ),
        })}
      >
        <input {...getInputProps({ id })} />
        {!controller.field.value && (
          <>
            <FileText className="text-primary" size={28} />
            <Paragraph variant="smallText">
              Drag & drop file here, or click to select.
            </Paragraph>
          </>
        )}
        {controller.field.value && (
          <>
            <FileCheck size={28} />
            <Paragraph variant="smallText">
              File selected. Click import to continue, or drop a new file here
              to replace.
            </Paragraph>
          </>
        )}
      </div>
      {controller.fieldState.error && (
        <span className="text-sm text-destructive">
          {controller.fieldState.error.message}
        </span>
      )}
    </div>
  );
}
