'use client';

import { useState } from 'react';
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
import { useToast } from '~/components/ui/use-toast';
import { AlertCircle, FileDown, Loader2 } from 'lucide-react';
import Paragraph from '~/components/ui/typography/Paragraph';
import UnorderedList from '~/components/ui/typography/UnorderedList';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { useForm } from 'react-hook-form';
import DropzoneField from './DropzoneField';
import { FormSchema } from '~/schemas/participant';
import { importParticipants } from '~/actions/participants';

const ImportCSVModal = ({
  onImportComplete,
}: {
  onImportComplete?: () => void;
}) => {
  const { toast } = useToast();
  const { control, handleSubmit, reset, formState } = useForm<FormSchema>({
    shouldUnregister: true,
    mode: 'onChange',
  });

  const { isSubmitting, isValid } = formState;

  const [showImportDialog, setShowImportDialog] = useState(false);

  const onSubmit = async (data: unknown) => {
    try {
      const safeData = FormSchema.parse(data);
      const result = await importParticipants(safeData.csvFile);

      if (
        result.existingParticipants &&
        result.existingParticipants.length > 0
      ) {
        toast({
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

      reset();
      setShowImportDialog(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      toast({
        title: 'Error',
        description: 'An error occurred while importing participants',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <FileDown className="mr-2 h-4 w-4" />
            Import participants
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import participants</DialogTitle>
            <DialogDescription>
              <Alert variant="info" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>CSV file requirements</AlertTitle>
                <AlertDescription>
                  <Paragraph>
                    Your CSV file can contain the following columns:
                  </Paragraph>
                  <UnorderedList>
                    <li>
                      identifier - must be a unique string, and{' '}
                      <strong>should not</strong> be easy to guess. Used to
                      generate the onboarding URL to allow integration with
                      other survey tools.
                    </li>
                    <li>
                      label - can be any text or number. Used to provide a human
                      readable label for the participant.
                    </li>
                  </UnorderedList>
                  <Paragraph>
                    Either an identifier column or a label column{' '}
                    <strong>must be provided</strong> for each participant.
                  </Paragraph>
                  <Paragraph>
                    Note: The identifier and label column headers must be
                    lowercase.
                  </Paragraph>
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <form
            id="uploadFile"
            onSubmit={handleSubmit(async (data) => await onSubmit(data))}
            className="flex flex-col"
          >
            <DropzoneField control={control} name="csvFile" />
          </form>
          <DialogFooter>
            <Button
              onClick={() => setShowImportDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !isValid}
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
