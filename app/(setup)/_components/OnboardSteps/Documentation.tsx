import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { FileText, MonitorPlay } from 'lucide-react';
import { setAppConfigured } from '~/app/_actions';
import SubmitButton from '~/components/ui/SubmitButton';
import { trackEvent } from '~/analytics/utils';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

function Documentation() {
  const handleAppConfigured = async () => {
    await setAppConfigured();
    void trackEvent({
      type: 'AppSetup',
    });
  };

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4">
        <Heading variant="h2">Documentation</Heading>
        <Paragraph>
          This is the end of the onboarding process. You are now ready to use
          Fresco! For further help and information, consider using the resources
          below.
        </Paragraph>
      </div>
      <Card className="mb-2">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <MonitorPlay size={30} className="mr-2" />
            <div>
              <CardTitle className="text-sm">Introduction Video</CardTitle>
              <Paragraph variant="smallText">
                Videos to help you get started with Fresco
              </Paragraph>
            </div>
          </div>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <FileText size={30} className="mr-2" />
            <div>
              <CardTitle className="text-sm">Documentation Articles</CardTitle>
              <Paragraph variant="smallText">
                Articles to help you get started with Fresco
              </Paragraph>
            </div>
          </div>
        </CardHeader>
        <CardContent></CardContent>
      </Card>

      <div className="flex justify-start pt-12">
        <form action={handleAppConfigured}>
          <SubmitButton variant="default" size={'lg'}>
            Go to the dashboard!
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

export default Documentation;
