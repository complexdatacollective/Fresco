import ImportCSVModal from '~/app/dashboard/participants/_components/ImportCSVModal';
import AnonymousRecruitmentSwitchClient from '~/components/AnonymousRecruitmentSwitchClient';
import SettingsSection from '~/components/layout/SettingsSection';
import LimitInterviewsSwitchClient from '~/components/LimitInterviewsSwitchClient';
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
    <div className="max-w-[30rem]">
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
        <SettingsSection
          heading="Import Participants"
          controlArea={<ImportCSVModal />}
        >
          <Paragraph>Upload a CSV file of participants.</Paragraph>
        </SettingsSection>
        <SettingsSection
          heading="Anonymous Recruitment"
          controlArea={
            <AnonymousRecruitmentSwitchClient
              allowAnonymousRecruitment={allowAnonymousRecruitment}
            />
          }
        >
          <Paragraph>
            Allow participants to join your study by visiting a URL.
          </Paragraph>
        </SettingsSection>
        <SettingsSection
          heading="Limit Interviews"
          controlArea={
            <LimitInterviewsSwitchClient limitInterviews={limitInterviews} />
          }
        >
          <Paragraph>
            Limit each participant to being allowed to complete one interview
            per protocol.
          </Paragraph>
        </SettingsSection>
      </div>
      <div className="flex justify-end">
        <OnboardContinue />
      </div>
    </div>
  );
}

export default ManageParticipants;
