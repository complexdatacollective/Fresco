import { FileCheck, FileText } from 'lucide-react';
import { useId } from 'react';
import { useDropzone } from 'react-dropzone';
import { useController, type Control } from 'react-hook-form';
import Paragraph from '~/components/typography/Paragraph';
import { Label } from '~/components/ui/Label';
import { type FormSchema } from '~/schemas/participant';
import parseCSV from '~/utils/parseCSV';
import { cn } from '~/utils/shadcn';

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

          if (!Array.isArray(value)) {
            return 'Invalid CSV. Please select a valid CSV file.';
          }

          // Check that every row has either a label or an identifier
          const valid = value.every(
            (row) =>
              (row.label !== undefined && row.label !== '') || row.identifier,
          );

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
        <span className="text-muted-foreground text-sm leading-5">{hint}</span>
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
        <span className="text-destructive text-sm">
          {controller.fieldState.error.message}
        </span>
      )}
    </div>
  );
}
