/* eslint-disable no-console */
import { Button } from '~/components/ui/Button';
import { exportSessions } from '../_actions/export';

const ExportInterviewsButton = () => {
  // export logic
  async function triggerExport() {
    const result = await exportSessions();

    if (result.data) {
      const link = document.createElement('a');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      link.href = result.data.data.url;
      link.download = 'exported_interviews.zip'; // Suggest a filename
      link.click();
    }
  }

  return <Button onClick={triggerExport}>Export all interviews</Button>;
};

export default ExportInterviewsButton;
