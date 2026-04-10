'use client';

import { FileDown, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { importParticipants } from '~/actions/participants';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { useToast } from '~/components/ui/Toast';
import { csvDataSchema } from '~/schemas/participant';
import { cx } from '~/utils/cva';
import parseCSV from '~/utils/parseCSV';

export default function ImportParticipants() {
  const [open, setOpen] = useState(false);
  const { add } = useToast();

  const handleFilesAccepted = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      try {
        const csvData = await parseCSV(file);
        const parsed = csvDataSchema.safeParse(csvData);

        if (!parsed.success) {
          add({
            title: 'Error',
            description:
              'File must be a valid CSV with label or identifier columns',
            type: 'destructive',
          });
          return;
        }

        const result = await importParticipants(parsed.data);

        if (result.error) {
          add({
            title: 'Error',
            description: result.error,
            type: 'destructive',
          });
          return;
        }

        if (
          result.existingParticipants &&
          result.existingParticipants.length > 0
        ) {
          add({
            title: 'Import completed with collisions',
            description: (
              <>
                <p>
                  Your participants were imported successfully, but some
                  identifiers collided with existing participants and were not
                  imported.
                </p>
                {result.existingParticipants.length < 5 && (
                  <ul>
                    {result.existingParticipants.map((item) => (
                      <li key={item.identifier}>{item.identifier}</li>
                    ))}
                  </ul>
                )}
              </>
            ),
            type: 'destructive',
          });
        } else {
          add({
            title: 'Participants imported',
            description: 'Participants have been imported successfully',
            type: 'success',
          });
        }

        setOpen(false);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
        add({
          title: 'Error',
          description: 'An error occurred while importing participants',
          type: 'destructive',
        });
      }
    },
    [add],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDropAccepted: handleFilesAccepted,
    accept: {
      'text/csv': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'application/vnd.ms-excel': [],
    },
    noClick: true,
    multiple: false,
    maxFiles: 1,
    maxSize: 1024 * 5000,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button icon={<FileDown />} />}>
        Import Participants
      </PopoverTrigger>
      <PopoverContent align="end" className="w-full max-w-md">
        <div
          {...getRootProps()}
          className={cx(
            'flex flex-col items-center gap-3 p-6 text-center',
            'rounded-sm border-2 border-dashed transition-colors',
            isDragActive && 'border-sea-green',
          )}
        >
          <input {...getInputProps()} />
          <div
            className={cx(
              'flex size-12 items-center justify-center rounded-full',
              isDragActive ? 'bg-sea-green' : 'bg-current/5',
            )}
          >
            <Upload
              className={cx(
                'size-6',
                isDragActive ? 'text-sea-green' : 'text-current',
              )}
            />
          </div>
          <div>
            <Heading level="h4" margin="none">
              {isDragActive ? 'Drop file here' : 'Import participants'}
            </Heading>
            <Paragraph margin="none" emphasis="muted" className="mt-1 text-sm">
              Drag & drop a <code>.csv</code> file here
            </Paragraph>
          </div>
          <Button size="sm" onClick={openFileDialog}>
            Browse files
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
