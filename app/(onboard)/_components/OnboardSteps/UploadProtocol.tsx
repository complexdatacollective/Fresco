import { Check } from 'lucide-react';
import { useState } from 'react';
import ProtocolUploader from '~/app/(dashboard)/dashboard/_components/ProtocolUploader';
import { Button } from '~/components/ui/Button';
import { Switch } from '~/components/ui/switch';
import { usePathname, useRouter } from 'next/navigation';

function ConfigureStudy() {
  const pathname = usePathname();
  const [protocolUploaded, setProtocolUploaded] = useState(false);
  const [participantsUploaded, setParticipantsUploaded] = useState(false);
  const router = useRouter();

  const handleProtocolUploaded = () => {
    setProtocolUploaded(true);
    // will be replaced with ProtocolUploader handling protocol upload
  };

  const handleParticipantsUploaded = () => {
    setParticipantsUploaded(true);
    // will be replaced with participants uplodaing handling participants upload
  };

  const handleNextStep = () => {
    router.replace(pathname + '?step=3');
  };

  const allowAnonymousRecruitment = () => {
    // will be replaced with switch handling
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
            <div>
              <h3 className="font-bold">Upload Protocol</h3>
              <p className="text-sm text-gray-600">
                Upload a .netcanvas protocol file.
              </p>
            </div>
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
