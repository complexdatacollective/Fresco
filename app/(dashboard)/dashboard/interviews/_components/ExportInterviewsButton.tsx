/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
import { type Interview } from '@prisma/client';
import { Button } from '~/components/ui/Button';
import { exportSessions } from '../_actions/export';

type ExportInterviewsButtonProps = {
  interviews: Interview[];
};

const ExportInterviewsButton = ({
  interviews,
}: ExportInterviewsButtonProps) => {
  // export logic
  async function triggerExport() {
    await exportSessions();
  }

  return <Button onClick={triggerExport}>Export all interviews</Button>;
};

export default ExportInterviewsButton;
