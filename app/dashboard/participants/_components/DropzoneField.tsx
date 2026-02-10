'use client';

import { FileCheck, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Paragraph from '~/components/typography/Paragraph';
import { Label } from '~/components/ui/Label';
import type { FieldValue } from '~/lib/form/components/Field/types';
import { useField } from '~/lib/form/hooks/useField';
import { cx } from '~/utils/cva';
import parseCSV from '~/utils/parseCSV';
import * as z from 'zod/v4';

const accept = {
  'text/csv': [],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
  'application/vnd.ms-excel': [],
};
const maxFiles = 1;
const maxSize = 1024 * 5000; // 5MB

// Zod schema for CSV validation
const csvRowSchema = z.object({
  label: z.string().optional(),
  identifier: z.string().optional(),
});

const csvDataSchema = z
  .array(csvRowSchema)
  .refine(
    (rows) =>
      rows.every(
        (row) =>
          (row.label !== undefined && row.label !== '') ||
          row.identifier !== undefined,
      ),
    {
      message:
        'Invalid CSV. Every row must have either a label or an identifier',
    },
  );

export default function DropzoneField<T>({
  name = 'csvFile',
  label,
  hint,
}: {
  name?: string;
  label?: string;
  hint?: string;
}) {
  const { id, fieldProps, meta, containerProps } = useField({
    name,
    required: true,
    custom: {
      schema: csvDataSchema,
      hint: 'File must be a valid CSV with label or identifier columns',
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
        fieldProps.onChange(csvData as FieldValue);
      }
    },
  });

  const hasValue = fieldProps.value !== undefined && fieldProps.value !== null;

  return (
    <div
      className="relative grid w-full items-center gap-1.5 overflow-hidden"
      {...containerProps}
    >
      {label && (
        <Label htmlFor={id} required>
          {label}
        </Label>
      )}
      {hint && (
        <span className="text-sm leading-5 text-current/70">{hint}</span>
      )}
      <div
        {...getRootProps({
          className: cx(
            'hover:border-primary relative mx-auto flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors',
          ),
        })}
      >
        <input {...getInputProps({ id })} />
        {!hasValue && (
          <>
            <FileText className="text-primary" size={28} />
            <Paragraph intent="smallText">
              Drag & drop file here, or click to select.
            </Paragraph>
          </>
        )}
        {hasValue && (
          <>
            <FileCheck size={28} />
            <Paragraph intent="smallText">
              File selected. Click import to continue, or drop a new file here
              to replace.
            </Paragraph>
          </>
        )}
      </div>
      {meta.shouldShowError && meta.errors && meta.errors.length > 0 && (
        <span className="text-destructive text-sm">{meta.errors[0]}</span>
      )}
    </div>
  );
}
