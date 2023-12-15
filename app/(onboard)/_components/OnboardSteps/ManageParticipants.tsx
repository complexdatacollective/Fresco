'use client';

import { Check } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import { useOnboardingContext } from '../OnboardingProvider';
import { useState } from 'react';
// import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch/AnonymousRecruitmentSwitch';

function ManageParticipants() {
  const [participantsUploaded, setParticipantsUploaded] = useState(false);
  const { currentStep, setCurrentStep } = useOnboardingContext();

  const handleParticipantsUploaded = () => {
    setParticipantsUploaded(true);
  };

  const handleNextStep = () => {
    void setCurrentStep(currentStep + 1);
  };

  return (
    <div className="max-w-[30rem]">
      <div className="mb-4 flex flex-col">
        <h1 className="text-3xl font-bold">Configure Participation</h1>
        <p className="mb-4 mt-4">
          You can now optionally upload a CSV file containing the details of
          participants you wish to recruit for your study. You can also choose
          to allow anonymous recruitment of participants. Both options can be
          configured later from the dashboard.
        </p>
      </div>
      <div className="mb-4 flex justify-between">
        <div>
          <h3 className="font-bold">Import Participants</h3>
          <p className="text-sm text-gray-600">
            Upload a CSV file of participants.
          </p>
        </div>
        {participantsUploaded && <Check />}
        {!participantsUploaded && (
          <ImportCSVModal onImportComplete={handleParticipantsUploaded} />
        )}
      </div>
      {/* <AnonymousRecruitmentSwitch /> */}
      <div className="flex justify-start">
        <Button onClick={handleNextStep}>
          {participantsUploaded ? 'Next' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}

export default ManageParticipants;
