import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { EnvironmentForm } from '../EnvironmentForm';

function ConfigureEnvironment({
  installationId,
}: {
  installationId: string | null;
}) {
  return (
    <div className="w-[30rem]">
      <div className="mb-4">
        <Heading variant="h2">Configure Environment</Heading>
        <Paragraph>
          Next, configure your environment. Follow the steps in the deployment
          guide to set these values.
        </Paragraph>
        <EnvironmentForm installationId={installationId} />
      </div>
    </div>
  );
}

export default ConfigureEnvironment;
