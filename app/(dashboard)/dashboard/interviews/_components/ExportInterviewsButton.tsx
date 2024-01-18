import { Button } from '~/components/ui/Button';

const ExportInterviewsButton = () => {
  // export logic
  // async function triggerExport() {
  //   const result = await exportSessions();

  //   if (result.data) {
  //     const link = document.createElement('a');
  //     link.href = result.data.url;
  //     link.download = result.data.name; // Zip file name
  //     link.click();
  //     return;
  //   }

  //   // eslint-disable-next-line no-console
  //   console.log(result.error); // Todo: add proper error handling here
  // }

  return <Button>Export all interviews</Button>;
};

export default ExportInterviewsButton;
