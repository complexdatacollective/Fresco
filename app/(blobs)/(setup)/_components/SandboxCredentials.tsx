import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { env } from '~/env';

export default function SandboxCredentials() {
  if (!env.SANDBOX_MODE) return null;
  return (
    <Alert variant="info">
      <AlertTitle>Sandbox Credentials</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col space-y-2">
          <div>
            <div>
              <span className="mr-2 font-semibold">Username:</span>
              <span>admin</span>
            </div>
            <div>
              <span className="mr-2 font-semibold">Password:</span>
              <span>Administrator1!</span>
            </div>
          </div>

          <div>
            The sandbox is a shared example environment not intended for real
            interviews.
            <span className="font-semibold"> All uploaded data is public.</span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
