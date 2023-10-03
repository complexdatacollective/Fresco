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
import { Dropzone } from '~/components/ui/DropzoneField';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '~/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '~/components/ui/form';
import useZodForm from '~/hooks/useZodForm';
import { z } from 'zod';
import { useToast } from '~/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  csvFile: z.array(z.record(z.string())).nullable(),
  csvColumn: z.string().optional(),
});

const ImportCSVModal = () => {
  const { toast } = useToast();
  const methods = useZodForm({ schema: formSchema, shouldUnregister: true });
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

  const { mutateAsync: importParticipants } =
    trpc.participant.create.useMutation({});

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
              <FormField
                control={methods.control}
                name="csvFile"
                defaultValue={null}
                rules={{ required: false }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select a CSV File</FormLabel>
                    <FormDescription>
                      For information about the format of this file, see our
                      documentation.
                    </FormDescription>
                    <Dropzone
                      value={field.value}
                      onChange={field.onChange}
                      error={methods.formState.errors.csvFile?.message}
                    />
                  </FormItem>
                )}
              />
              {showColumnSelect && (
                <FormField
                  control={methods.control}
                  name="csvColumn"
                  rules={{ required: false }}
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormLabel>Select identifier column</FormLabel>
                      <FormDescription>
                        Your CSV file did not contain a column named
                        &quot;identifiers&quot;. Please select the column that
                        you wish to use to uniquely identify the participants
                        you are importing.
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue=""
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a column..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {csvColumns.map((item) => (
                            <SelectItem value={item} key={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {error && (
                        <span className="text-sm text-destructive">
                          {error?.message}
                        </span>
                      )}
                    </FormItem>
                  )}
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
