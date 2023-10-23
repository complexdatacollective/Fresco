'use client';

import { useMemo, useState } from 'react';
import { trpc } from '~/app/_trpc/client';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { DropzoneField } from './DropzoneField';
import { Form } from '~/components/ui/form';
import useZodForm from '~/hooks/useZodForm';
import { z } from 'zod';
import { useToast } from '~/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { ColumnSelectField } from './ColumnSelectField';

const formSchema = z.object({
  csvFile: z.array(z.record(z.string())).nullable(),
  csvColumn: z.string().optional(),
});

const ImportCSVModal = ({
  onImportComplete,
}: {
  onImportComplete?: () => void;
}) => {
  const { toast } = useToast();
  const methods = useZodForm({ schema: formSchema, shouldUnregister: true });
  const utils = trpc.useContext();
  const { mutateAsync: importParticipants } =
    trpc.participant.create.useMutation();
  const isSubmitting = methods.formState.isSubmitting;
  const [showImportDialog, setShowImportDialog] = useState(false);
  const selectedCSV = methods.watch('csvFile');

  // To determine if we need to prompt the user for which column to use as the
  // identifier, we check if the CSV file has a column named "identifier" or if
  // it only has one column. If it has one column, we assume that it is the
  // identifier column. Otherwise we show our followup question.
  const showColumnSelect = useMemo(() => {
    if (!selectedCSV) return false;

    const ObjKeys = Object.keys(selectedCSV[0] || {});
    if (ObjKeys.includes('identifier') || ObjKeys.length === 1) {
      return false;
    }

    return true;
  }, [selectedCSV]);

  const csvColumns = useMemo(() => {
    if (!selectedCSV) return [];

    return Object.keys(selectedCSV[0] || {});
  }, [selectedCSV]);

  const onSubmit = async (data: unknown) => {
    const validData = formSchema.parse(data);

    if (!validData.csvFile) {
      methods.setError('csvFile', {
        message: 'You must upload a CSV file!',
      });
      return;
    }

    if (validData.csvFile.length === 0) {
      methods.setError('csvFile', {
        message: 'Your CSV file is empty! Please upload a valid CSV file.',
      });
      return;
    }

    if (showColumnSelect && !validData.csvColumn) {
      methods.setError('csvColumn', {
        message: 'You must select a column representing the identifier!',
      });
      return;
    }

    const ObjectKeys = Object.keys(validData.csvFile[0] || {});

    const identifierColumn = showColumnSelect
      ? validData.csvColumn!
      : ObjectKeys.includes('identifier')
      ? 'identifier'
      : (ObjectKeys[0] as keyof (typeof validData.csvFile)[0]);

    const identifiers = validData.csvFile
      .map((item) => item[identifierColumn])
      .filter(Boolean);
    const result = await importParticipants(identifiers);

    if (result.error) {
      // eslint-disable-next-line no-console
      console.log(result.error);
      return;
    }

    await utils.participant.get.all.refetch();

    if (result.existingParticipants && result.existingParticipants.length > 0) {
      toast({
        title: 'Import completed with collisions',
        description: (
          <>
            <p>
              Your participants were imported successfully, but some identifiers
              collided with existing participants and were not imported.
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
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Participants imported',
        description: 'Participants have been imported successfully',
        variant: 'success',
      });
    }

    onImportComplete?.();

    methods.reset();
    setShowImportDialog(false);
  };

  return (
    <>
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogTrigger asChild>
          <Button variant="outline">Import participants</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import participants</DialogTitle>
            <DialogDescription>Drag and drop CSV file below</DialogDescription>
          </DialogHeader>
          <Form {...methods}>
            <form
              id="uploadFile"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSubmit={methods.handleSubmit(
                async (data) => await onSubmit(data),
              )}
              className="flex flex-col gap-6"
            >
              <DropzoneField
                label="Select a CSV file"
                description="Your CSV file must contain a column named 'identifier' with the participant identifier. For information about the format of this file, see our documentation."
                control={methods.control}
                error={methods.formState.errors.csvFile?.message}
              />
              {showColumnSelect && (
                <ColumnSelectField
                  control={methods.control}
                  csvColumns={csvColumns}
                  label="Select identifier column"
                  description='Your CSV file did not contain a column named "identifiers". Please select the column that you wish to use to uniquely identify the participants you are importing.'
                />
              )}
            </form>
          </Form>
          <DialogFooter>
            <Button
              disabled={isSubmitting || !methods.formState.isValid}
              form="uploadFile"
              type="submit"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportCSVModal;
