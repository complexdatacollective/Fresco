import { KeyRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { env } from '~/env';

export default function SandboxCredentials() {
  if (!env.SANDBOX_MODE) return null;
  return (
    <Alert variant="info">
      <KeyRound className="h-4 w-4" />
      <AlertTitle>Sandbox Credentials</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col">
          <div>
            <span className="mr-2 font-semibold">Username:</span>
            <span>admin</span>
          </div>
          <div>
            <span className="mr-2 font-semibold">Password:</span>
            <span>Administrator1!</span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
