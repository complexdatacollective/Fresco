import { AlertCircle } from 'lucide-react';
import Link from '~/components/Link';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/Alert';

export default function AnonymousRecruitmentWarning() {
  return (
    <Alert variant="info">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        Anonymous recruitment is enabled. This means that participants can
        self-enroll in your study without needing to be invited. To disable
        anonymous recruitment, click the toggle switch in{' '}
        <Link href="/dashboard/settings">the settings page</Link>.
      </AlertDescription>
    </Alert>
  );
}
