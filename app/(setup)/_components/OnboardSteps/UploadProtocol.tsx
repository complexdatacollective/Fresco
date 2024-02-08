'use client';
import ProtocolUploader from '~/app/(dashboard)/dashboard/_components/ProtocolUploader';
import { Button } from '~/components/ui/Button';
import { useOnboardingContext } from '../OnboardingProvider';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

function ConfigureStudy() {
  const { currentStep, setCurrentStep } = useOnboardingContext();

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <Heading>Upload a Protocol</Heading>
        <Paragraph>
          Upload a Network Canvas protocol file (<code>.netcanvas</code>). You
          can upload more protocol files later from the dashboard. You can also
          skip this step to upload a protocol later.
        </Paragraph>
      </div>
      <div>
        <div className="mb-4">
          <ProtocolUploader handleProtocolUploaded={() => handleNextStep()} />
        </div>
        <div className="flex justify-start">
          <Button onClick={handleNextStep}>Skip</Button>
        </div>
      </div>
    </div>
  );
}

export default ConfigureStudy;
