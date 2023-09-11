import { Check } from 'lucide-react';
import React, { useState } from 'react';
import ProtocolUploader from '~/app/(dashboard)/dashboard/_components/ProtocolUploader';
import { Button } from '~/components/ui/Button';
import { Switch } from '~/components/ui/switch';

interface ConfigureStudyProps {
  handleNextStep: () => void;
}

function ConfigureStudy({ handleNextStep }: ConfigureStudyProps) {
  const [protocolUploaded, setProtocolUploaded] = useState(false);
  const [participantsUploaded, setParticipantsUploaded] = useState(false);

  const handleProtocolUploaded = () => {
    setProtocolUploaded(true);
    // TODO: Upload protocol
  };

  const handleParticipantsUploaded = () => {
    setParticipantsUploaded(true);
    // TODO: Upload participants
  };

  return (
    <div>
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Configure Study</h1>
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
                <Switch />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-start">
          <Button onClick={handleNextStep}>
            {' '}
            {protocolUploaded ? 'Next' : 'Skip'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfigureStudy;
