'use client';
import { parseAsInteger, useQueryState } from 'nuqs';
import ProtocolUploader from '~/app/dashboard/_components/ProtocolUploader';
import { Button } from '~/components/ui/Button';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

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
      <div className="flex flex-col">
        <Heading variant="h2">Import Protocols</Heading>
        <Paragraph>
          If you have already created a Network Canvas protocol (
          <code>.netcanvas</code>) you can import it now.
        </Paragraph>
        <Paragraph>
          If you don&apos;t have a protocol yet, you can upload one later from
          the dashboard.
        </Paragraph>
        <ProtocolUploader
          className="m-10 p-8"
          buttonVariant="outline"
          buttonSize="lg"
          hideCancelButton
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleNextStep}>Continue</Button>
      </div>
    </div>
  );
}

export default ConfigureStudy;
