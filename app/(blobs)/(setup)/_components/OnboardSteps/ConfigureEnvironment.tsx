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
          To use Fresco, you need to configure your project.
        </Paragraph>
        <EnvironmentForm installationId={installationId} />
      </div>
    </div>
  );
}

export default ConfigureEnvironment;
