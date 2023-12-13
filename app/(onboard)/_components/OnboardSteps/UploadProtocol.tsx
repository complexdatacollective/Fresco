'use client';
import { Check } from 'lucide-react';
import { useState } from 'react';
import ProtocolUploader from '~/app/(dashboard)/dashboard/_components/ProtocolUploader';
import { Button } from '~/components/ui/Button';
import { useOnboardingContext } from '../OnboardingProvider';

function ConfigureStudy() {
  const [protocolUploaded] = useState(false);
  const { currentStep, setCurrentStep } = useOnboardingContext();

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Upload a Protocol</h1>
        <p className="mb-4 mt-4">
          Upload a Network Canvas protocol file (<code>.netcanvas</code>) to
          create your study. You can upload more protocol files later from the
          dashboard, and you can skip this step to upload a protocol later.
        </p>
      </div>
      <div>
        <div className="mb-4">
          <div className="flex justify-between">
            {protocolUploaded && <Check />}
          </div>
          <ProtocolUploader />
        </div>
        <div className="flex justify-start">
          <Button onClick={handleNextStep}>
            {protocolUploaded ? 'Next' : 'Skip'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfigureStudy;
