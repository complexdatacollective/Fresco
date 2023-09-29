import { Check } from 'lucide-react';
import { useState } from 'react';
import ProtocolUploader from '~/app/(dashboard)/dashboard/_components/ProtocolUploader';
import { Button } from '~/components/ui/Button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';

function ConfigureStudy() {
  const pathname = usePathname() as Route;
  const [protocolUploaded, setProtocolUploaded] = useState(false);
  const searchParams = useSearchParams();
  const currentStep = searchParams.get('step') as string;
  const router = useRouter();

  const handleProtocolUploaded = () => {
    setProtocolUploaded(true);
    // will be replaced with ProtocolUploader handling protocol upload
  };

  const handleNextStep = () => {
    router.replace(`${pathname}?step=${parseInt(currentStep) + 1}`);
  };

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Upload a protocol</h1>
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
          {!protocolUploaded && <ProtocolUploader />}
          {!protocolUploaded && (
            <button onClick={handleProtocolUploaded}>Confirm Uploaded</button>
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
