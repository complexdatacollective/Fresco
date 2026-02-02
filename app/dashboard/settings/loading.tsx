import { SettingsCardSkeleton } from '~/components/settings/SettingsCard';
import SettingsNavigation, {
  type SettingsSection,
} from '~/components/settings/SettingsNavigation';
import PageHeader from '~/components/typography/PageHeader';
import { env } from '~/env';

function getSettingsSections(): SettingsSection[] {
  const sections: SettingsSection[] = [
    { id: 'app-version', title: 'App Version' },
    { id: 'user-management', title: 'User Management' },
    { id: 'configuration', title: 'Configuration' },
    { id: 'interview-settings', title: 'Interview Settings' },
    { id: 'privacy', title: 'Privacy' },
    { id: 'preview-mode', title: 'Preview Mode' },
  ];

  if (env.NODE_ENV === 'development' || !env.SANDBOX_MODE) {
    sections.push({
      id: 'developer-tools',
      title: 'Developer Tools',
      variant: 'destructive',
    });
  }

  return sections;
}

export default function Loading() {
  const sections = getSettingsSections();

  return (
    <>
      <PageHeader
        headerText="Settings"
        subHeaderText="Here you can configure your installation of Fresco."
      />
      <div className="mx-auto">
        <div className="flex gap-8">
          <SettingsNavigation sections={sections} />
          <div className="min-w-0 flex-1 space-y-6">
            <SettingsCardSkeleton rows={1} />

            <SettingsCardSkeleton rows={1} />

            <SettingsCardSkeleton rows={2} />

            <SettingsCardSkeleton rows={3} />

            <SettingsCardSkeleton rows={1} />

            <SettingsCardSkeleton rows={3} />

            {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
              <SettingsCardSkeleton rows={3} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
