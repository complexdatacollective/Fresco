import ImportCSVModal from '~/app/dashboard/participants/_components/ImportCSVModal';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import SettingsSection from '~/components/layout/SettingsSection';
// import LimitInterviewsSwitch from '~/components/LimitInterviewsSwitch';
import OnboardContinue from '../OnboardContinue';
// import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch';

function ManageParticipants() {
  return (
    <div className="max-w-[30rem]">
      <div className="mb-6">
        <Heading variant="h2">Configure Participation</Heading>
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
          controlArea={<></>}
          // controlArea={<AnonymousRecruitmentSwitch />}
        >
          <Paragraph>
            Allow participants to join your study by visiting a URL.
          </Paragraph>
        </SettingsSection>
        <SettingsSection
          heading="Limit Interviews"
          controlArea={<></>}
          // controlArea={<LimitInterviewsSwitch />}
        >
          <Paragraph>
            Limit each participant to being allowed to complete one interview
            per protocol.
          </Paragraph>
        </SettingsSection>
      </div>
      <div className="flex justify-start">
        <OnboardContinue />
      </div>
    </div>
  );
}

export default ManageParticipants;
