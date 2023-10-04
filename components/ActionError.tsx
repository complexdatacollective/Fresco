import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/Alert';

const ActionError = ({
  errorTitle,
  errorDescription,
}: {
  errorTitle: string;
  errorDescription: string;
}) => {
  return (
    <Alert variant="destructive" className="bg-white">
      <AlertCircle className="h-10 w-10" />
      <AlertTitle>{errorTitle} </AlertTitle>
      <AlertDescription>{errorDescription}</AlertDescription>
    </Alert>
  );
};

export default ActionError;
