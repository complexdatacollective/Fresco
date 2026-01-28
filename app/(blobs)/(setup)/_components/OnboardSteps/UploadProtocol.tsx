'use client';
import { parseAsInteger, useQueryState } from 'nuqs';
import ProtocolUploader from '~/app/dashboard/_components/ProtocolUploader';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';

function ConfigureStudy() {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };

  return (
    <div className="flex max-w-[30rem] flex-col items-stretch justify-between">
      <Heading level="h2">Import Protocols</Heading>
      <Paragraph>
        If you have already created a Network Canvas protocol (
        <code>.netcanvas</code>) you can import it now.
      </Paragraph>
      <Paragraph>
        If you don&apos;t have a protocol yet, you can upload one later from the
        dashboard.
      </Paragraph>
      <ProtocolUploader hideCancelButton />
      <div className="mt-6 flex justify-end">
        <Button onClick={handleNextStep} color="primary">
          Continue
        </Button>
      </div>
    </div>
  );
}

export default ConfigureStudy;
