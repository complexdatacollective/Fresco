import { parseAsInteger, useQueryState } from 'nuqs';
import { Button } from '~/components/ui/Button';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { EnvironmentForm } from '../EnvironmentForm';

function ConfigureEnvironment({
  installationId,
  hasUploadthingEnv,
}: {
  installationId: string | null;
  hasUploadthingEnv: boolean;
}) {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };
  return (
    <div className="w-[30rem]">
      <div className="mb-4">
        <Heading variant="h2">Configure Environment</Heading>
        <Paragraph>
          To use Fresco, you need to configure your project.
        </Paragraph>
        <EnvironmentForm installationId={installationId} />
      </div>
      {hasUploadthingEnv && <Button onClick={handleNextStep}>Proceed</Button>}
    </div>
  );
}

export default ConfigureEnvironment;
