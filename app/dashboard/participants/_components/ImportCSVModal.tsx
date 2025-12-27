'use client';

import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ZodError } from 'zod';
import { importParticipants } from '~/actions/participants';
import Paragraph from '~/components/typography/Paragraph';
import UnorderedList from '~/components/typography/UnorderedList';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';
import Dialog from '~/lib/dialogs/Dialog';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import { useFormMeta } from '~/lib/form/hooks/useFormState';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import type { FormSubmissionResult } from '~/lib/form/store/types';
import { FormSchema } from '~/schemas/participant';
import DropzoneField from './DropzoneField';

function ImportButton() {
  const { isSubmitting, isValid } = useFormMeta();

  return (
    <Button
      disabled={isSubmitting || !isValid}
      form="uploadFile"
      type="submit"
      color="primary"
    >
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isSubmitting ? 'Importing...' : 'Import'}
    </Button>
  );
}

function ImportDialogContent({
  onClose,
  onImportComplete,
}: {
  onClose: () => void;
  onImportComplete?: () => void;
}) {
  const { toast } = useToast();

  const handleSubmit = async (data: unknown): Promise<FormSubmissionResult> => {
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
      onClose();
      return { success: true };
    } catch (e) {
      if (e instanceof ZodError) {
        toast({
          title: 'Error',
          description: e.issues[0]
            ? `Invalid CSV File: ${e.issues[0].message}`
            : 'Invalid CSV file. Please check the file requirements and try again.',
          variant: 'destructive',
        });
        return {
          success: false,
          formErrors: [e.issues[0]?.message ?? 'Invalid CSV file'],
        };
      }
      // eslint-disable-next-line no-console
      console.log(e);
      toast({
        title: 'Error',
        description: 'An error occurred while importing participants',
        variant: 'destructive',
      });
      return {
        success: false,
        formErrors: ['An error occurred while importing participants'],
      };
    }
  };

  return (
    <FormStoreProvider>
      <Dialog
        open={true}
        closeDialog={onClose}
        title="Import participants"
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <ImportButton />
          </>
        }
      >
        <Alert variant="info" className="m-0">
          <AlertTitle>CSV file requirements</AlertTitle>
          <AlertDescription>
            <Paragraph>
              Your CSV file can contain the following columns:
            </Paragraph>
            <UnorderedList>
              <li>
                identifier - must be a unique string, and{' '}
                <strong>should not</strong> be easy to guess. Used to generate
                the onboarding URL to allow integration with other survey tools.
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
              Note: The identifier and label column headers must be lowercase.
            </Paragraph>
          </AlertDescription>
        </Alert>
        <FormWithoutProvider
          id="uploadFile"
          onSubmit={handleSubmit}
          className="mt-4 flex w-full flex-col"
        >
          <DropzoneField name="csvFile" />
        </FormWithoutProvider>
      </Dialog>
    </FormStoreProvider>
  );
}

const ImportCSVModal = ({
  onImportComplete,
}: {
  onImportComplete?: () => void;
}) => {
  const [showImportDialog, setShowImportDialog] = useState(false);

  return (
    <>
      <Button className="w-full" onClick={() => setShowImportDialog(true)}>
        <FileDown className="mr-2 h-4 w-4" />
        Import participants
      </Button>

      {showImportDialog && (
        <ImportDialogContent
          onClose={() => setShowImportDialog(false)}
          onImportComplete={onImportComplete}
        />
      )}
    </>
  );
};

export default ImportCSVModal;
