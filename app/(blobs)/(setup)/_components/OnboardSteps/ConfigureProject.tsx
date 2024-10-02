import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { EnvironmentForm } from '../EnvironmentForm';

function ConfigureProject() {
  return (
    <div className="w-[30rem]">
      <div className="mb-4">
        <Heading variant="h2">Configure Project</Heading>
        <Paragraph>
          To use Fresco, you need to configure your project.
        </Paragraph>
        <EnvironmentForm />
      </div>
    </div>
  );
}

export default ConfigureProject;
