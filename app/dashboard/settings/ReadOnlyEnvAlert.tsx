import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';

export default function ReadOnlyEnvAlert() {
  return (
    <Alert variant="info">
      <AlertTitle>Note</AlertTitle>
      <AlertDescription>
        This setting is controlled by your <code>.env</code> file, and so can
        only be changed by modifying that file.
      </AlertDescription>
    </Alert>
  );
}
