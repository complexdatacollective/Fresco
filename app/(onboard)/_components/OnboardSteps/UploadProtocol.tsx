'use client';
import { Check } from 'lucide-react';
import { useState } from 'react';
import ProtocolUploader from '~/app/(dashboard)/dashboard/_components/ProtocolUploader';
import { Button } from '~/components/ui/Button';
import { useOnboardingContext } from '../OnboardingProvider';

function ConfigureStudy() {
  const [protocolUploaded, setProtocolUploaded] = useState(false);
  const { currentStep, setCurrentStep } = useOnboardingContext();

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Upload a Protocol</h1>
        <p className="mb-4 mt-4">
          Upload a Network Canvas protocol file (<code>.netcanvas</code>). You
          can upload more protocol files later from the dashboard. You can also
          skip this step to upload a protocol later.
        </p>
      </div>
      <div>
        <div className="mb-4">
          {protocolUploaded ? (
            <div className="flex h-[150px] items-center gap-6">
              Protocol uploaded
              <Check className="text-green-500" />
            </div>
          ) : (
            <ProtocolUploader
              handleProtocolUploaded={() => setProtocolUploaded(true)}
            />
          )}
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
