/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
import { Button } from '~/components/ui/Button';
import { exportToFile } from '~/lib/interviewer/utils/exportProcess';

const ExportInterviewsButton = () => {
  function triggerExport() {
    console.log('Export happens');

    exportToFile(['interview 1', 'interview 2', 'interview 3'], 'filename')
      .then(({ run, abort, setConsideringAbort }) => {
        console.log({ abort, setConsideringAbort });

        return run();
      })
      .then(() => console.log('Some action happens here'))
      .catch((error: unknown) => {
        console.log('error:', error);
      });
  }

  return <Button onClick={triggerExport}>Export all interviews</Button>;
};

export default ExportInterviewsButton;
