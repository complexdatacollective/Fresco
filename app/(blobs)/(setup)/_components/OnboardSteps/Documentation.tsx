import { createId } from '@paralleldrive/cuid2';
import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';
import { setAppSetting } from '~/actions/appSettings';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import Button, { IconButton } from '~/components/ui/Button';
import trackEvent from '~/lib/analytics';
import { getInstallationId } from '~/queries/appSettings';

export default function Documentation() {
  const handleAppConfigured = async () => {
    const installationId = await getInstallationId();
    if (!installationId) {
      await setAppSetting('installationId', createId());
    }
    await setAppSetting('configured', true);
    void trackEvent({
      type: 'AppSetup',
      metadata: {
        installationId,
      },
    });

    redirect('/dashboard');
  };

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4">
        <Heading level="h2">Documentation</Heading>
        <Paragraph>
          This is the end of the onboarding process. You are now ready to use
          Fresco! For further help and information, consider using the resources
          below.
        </Paragraph>
      </div>
      <div className="flex flex-col gap-2">
        <Surface className="flex gap-10">
          <div className="flex-1">
            <Heading level="h4" variant="all-caps" className="mb-2">
              About Fresco
            </Heading>
            Visit our documentation site to learn more about Fresco.
          </div>
          <div className="flex min-w-32 shrink-0 flex-col items-end justify-center">
            <a
              href="https://documentation.networkcanvas.com/en/fresco"
              target="_blank"
            >
              <IconButton
                variant="outline"
                aria-label="View Fresco documentation"
                icon={<FileText />}
              />
            </a>
          </div>
        </Surface>
        <Surface className="flex gap-10">
          <div className="flex-1">
            <Heading level="h4" variant="all-caps" className="mb-2">
              Using Fresco
            </Heading>
            Read our guide on the basic workflow for using Fresco to conduct
            your study.
          </div>
          <div className="flex min-w-32 shrink-0 flex-col items-end justify-center">
            <a
              href="https://documentation.networkcanvas.com/en/fresco/using-fresco"
              target="_blank"
            >
              <IconButton
                variant="outline"
                aria-label="View Using Fresco guide"
                icon={<FileText />}
              />
            </a>
          </div>
        </Surface>
      </div>

      <div className="flex justify-end pt-12">
        <Button onClick={handleAppConfigured} color="primary">
          Go to the dashboard!
        </Button>
      </div>
    </div>
  );
}
