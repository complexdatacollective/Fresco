'use client';

import { Check } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import ImportCSVModal from '~/app/(dashboard)/dashboard/participants/_components/ImportCSVModal';
import { useOnboardingContext } from '../OnboardingProvider';
import { useOptimistic, useState, useTransition } from 'react';
import { Switch } from '~/components/ui/switch';
import { api } from '~/trpc/client';
import { setAnonymousRecruitment } from '~/components/AnonymousRecruitmentSwitch/action';

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
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    {children}
  </div>
);

const RecruitmentSwitch = () => {
  const { data: appSettings, isLoading } = api.appSettings.get.useQuery(
    undefined,
    {},
  );

  const allowAnonymousRecruitment = !!appSettings?.allowAnonymousRecruitment;

  const [, startTransition] = useTransition();
  const [
    optimisticAllowAnonymousRecruitment,
    setOptimisticAllowAnonymousRecruitment,
  ] = useOptimistic(
    allowAnonymousRecruitment,
    (state: boolean, newState: boolean) => newState,
  );

  return (
    <Switch
      name="allowAnonymousRecruitment"
      disabled={isLoading}
      checked={optimisticAllowAnonymousRecruitment}
      onCheckedChange={(value) => {
        startTransition(async () => {
          setOptimisticAllowAnonymousRecruitment(value);
          await setAnonymousRecruitment(value);
        });
      }}
    />
  );
};

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
        <h1 className="text-3xl font-bold">Configure Participation</h1>
        <p className="mt-4">
          You can now optionally upload a CSV file containing the details of
          participants you wish to recruit for your study. You can also choose
          to allow anonymous recruitment of participants. Both options can be
          configured later from the dashboard.
        </p>
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
