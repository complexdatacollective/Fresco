import { Alert, AlertDescription, AlertTitle } from '@codaco/fresco-ui/Alert';

const ActionError = ({
  errorTitle,
  errorDescription,
}: {
  errorTitle: string;
  errorDescription: string;
}) => {
  return (
    <Alert variant="destructive">
      <AlertTitle>{errorTitle} </AlertTitle>
      <AlertDescription>{errorDescription}</AlertDescription>
    </Alert>
  );
};

export default ActionError;
