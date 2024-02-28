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
    <div className="flex max-w-[30rem] flex-col items-stretch justify-between">
      <div className="flex flex-col">
        <Heading variant="h2">Upload a Protocol</Heading>
        <Paragraph>
          Upload a Network Canvas protocol file (<code>.netcanvas</code>). You
          can upload more protocol files later from the dashboard. You can also
          skip this step by clicking &quot;Proceed&quot; button to upload a
          protocol later.
        </Paragraph>
      </div>
      <div className="flex justify-between gap-4">
        <ProtocolUploader />
        <Button onClick={handleNextStep}>Proceed</Button>
      </div>
    </div>
  );
}

export default ConfigureStudy;
