import ImportCSVModal from '~/app/dashboard/participants/_components/ImportCSVModal';
import AnonymousRecruitmentSwitchClient from '~/components/AnonymousRecruitmentSwitchClient';
import LimitInterviewsSwitchClient from '~/components/LimitInterviewsSwitchClient';
import SettingsCard from '~/components/settings/SettingsCard';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import OnboardContinue from '../OnboardContinue';

function ManageParticipants({
  allowAnonymousRecruitment,
  limitInterviews,
}: {
  allowAnonymousRecruitment: boolean;
  limitInterviews: boolean;
}) {
  return (
    <div className="w-full max-w-[40rem]">
      <div className="mb-6">
        <Heading level="h2">Configure Participation</Heading>
        <Paragraph>
          You can now optionally upload a CSV file containing the details of
          participants you wish to recruit for your study. You can also choose
          to allow anonymous recruitment of participants. Both options can be
          configured later from the dashboard.
        </Paragraph>
      </div>
      <div className="mb-6 flex flex-col gap-2">
        <SettingsCard
          title="Import Participants"
          controlArea={<ImportCSVModal />}
          className="bg-surface-1 text-surface-1-contrast"
        >
          <Paragraph>Upload a CSV file of participants.</Paragraph>
        </SettingsCard>
        <SettingsCard
          title="Anonymous Recruitment"
          controlArea={
            <AnonymousRecruitmentSwitchClient
              allowAnonymousRecruitment={allowAnonymousRecruitment}
            />
          }
          className="bg-surface-1 text-surface-1-contrast"
        >
          <Paragraph>
            Allow participants to join your study by visiting a URL.
          </Paragraph>
        </SettingsCard>
        <SettingsCard
          title="Limit Interviews"
          controlArea={
            <LimitInterviewsSwitchClient limitInterviews={limitInterviews} />
          }
          className="bg-surface-1 text-surface-1-contrast"
        >
          <Paragraph>
            Limit each participant to being allowed to complete one interview
            per protocol.
          </Paragraph>
        </SettingsCard>
      </div>
      <div className="flex justify-end">
        <OnboardContinue />
      </div>
    </div>
  );
}

export default ManageParticipants;
