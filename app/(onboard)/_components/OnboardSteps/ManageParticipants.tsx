import { Check } from 'lucide-react';
import { useState } from 'react';
import ProtocolUploader from '~/app/(dashboard)/dashboard/_components/ProtocolUploader';
import { Button } from '~/components/ui/Button';
import { Switch } from '~/components/ui/switch';
import { usePathname, useRouter } from 'next/navigation';

function ManageParticipants() {
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
    <div>
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Configure Your Study</h1>
        <p>Configure a study</p>
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

        {protocolUploaded && (
          <>
            <div className="mb-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold">Invite Participants</h3>
                  <p className="text-sm text-gray-600">
                    Upload a CSV file of participants.
                  </p>
                </div>
                {participantsUploaded && <Check />}
              </div>
              {!participantsUploaded && <ProtocolUploader />}
              {!participantsUploaded && (
                <button onClick={handleParticipantsUploaded}>
                  Confirm Uploaded
                </button>
              )}
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Anonymous Recruitment</h3>
                  <p className="text-sm text-gray-600">
                    Allow anonymous recruitment of participants.
                  </p>
                </div>
                <Switch onCheckedChange={allowAnonymousRecruitment} />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-start">
          <Button onClick={handleNextStep}>
            {protocolUploaded ? 'Next' : 'Skip'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ManageParticipants;
