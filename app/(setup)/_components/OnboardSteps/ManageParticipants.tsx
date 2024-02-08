'use client';

import { Check } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import { useOnboardingContext } from '../OnboardingProvider';
import { useState } from 'react';
import RecruitmentSwitch from '~/components/RecruitmentSwitch';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

const SettingsSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between rounded-md border border-muted p-4">
    <div>
      <Heading variant="h3">{title}</Heading>
      <Paragraph>{description}</Paragraph>
    </div>
    {children}
  </div>
);

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
      <div className="mb-6">
        <Heading variant="h1">Configure Participation</Heading>
        <Paragraph>
          You can now optionally upload a CSV file containing the details of
          participants you wish to recruit for your study. You can also choose
          to allow anonymous recruitment of participants. Both options can be
          configured later from the dashboard.
        </Paragraph>
      </div>
      <div className="mb-6 flex flex-col gap-2">
        <SettingsSection
          title="Import Participants"
          description="Upload a CSV file of participants."
        >
          {participantsUploaded && <Check />}
          {!participantsUploaded && (
            <ImportCSVModal onImportComplete={handleParticipantsUploaded} />
          )}
        </SettingsSection>
        <SettingsSection
          title="Anonymous Recruitment"
          description="Allow participants to join your study by visiting a URL."
        >
          <RecruitmentSwitch />
        </SettingsSection>
      </div>
      <div className="flex justify-start">
        <Button onClick={handleNextStep}>Continue</Button>
      </div>
    </div>
  );
}

export default ManageParticipants;
