import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import RecruitmentTestSectionServer from '../../_components/RecruitmentTestSectionServer';
import ResetButton from '../../_components/ResetButton';

export default function DeveloperToolsSection() {
  return (
    <SettingsCard
      id="developer-tools"
      title="Developer Tools"
      variant="destructive"
      divideChildren
    >
      <SettingsField
        label="Reset Settings"
        description="Delete all data and reset Fresco to its default state."
        control={<ResetButton />}
      />
      <RecruitmentTestSectionServer />
    </SettingsCard>
  );
}
