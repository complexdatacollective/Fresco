import { Suspense } from 'react';
import { SettingsCardSkeleton } from '~/components/settings/SettingsCard';
import SettingsNavigation, {
  type SettingsSection,
} from '~/components/settings/SettingsNavigation';
import PageHeader from '~/components/typography/PageHeader';
import VersionSection, {
  VersionSectionSkeleton,
} from '~/components/VersionSection';
import { env } from '~/env';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import ConfigurationSection from './_components/ConfigurationSection';
import DeveloperToolsSection from './_components/DeveloperToolsSection';
import InterviewSettingsSection from './_components/InterviewSettingsSection';
import ApiTokensSection from './_components/ApiTokensSection';
import PreviewModeSection from './_components/PreviewModeSection';
import PrivacySection from './_components/PrivacySection';
import UserManagementSection from './_components/UserManagementSection';

function getSettingsSections(): SettingsSection[] {
  const sections: SettingsSection[] = [
    { id: 'app-version', title: 'App Version' },
    { id: 'user-management', title: 'User Management' },
    { id: 'configuration', title: 'Configuration' },
    { id: 'interview-settings', title: 'Interview Settings' },
    { id: 'privacy', title: 'Privacy' },
    { id: 'api-tokens', title: 'API Tokens' },
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

function SettingsContentSkeleton() {
  const sections = getSettingsSections();

  return (
    <div className="mx-auto max-w-full">
      <div className="flex gap-8">
        <SettingsNavigation sections={sections} />
        <div className="min-w-0 flex-1 space-y-6">
          <SettingsCardSkeleton rows={1} />
          <SettingsCardSkeleton rows={1} />
          <SettingsCardSkeleton rows={2} />
          <SettingsCardSkeleton rows={3} />
          <SettingsCardSkeleton rows={1} />
          <SettingsCardSkeleton rows={2} />
          <SettingsCardSkeleton rows={2} />
          {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
            <SettingsCardSkeleton rows={3} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <>
      <PageHeader
        headerText="Settings"
        subHeaderText="Here you can configure your installation of Fresco."
        data-testid="settings-page-header"
      />
      <Suspense fallback={<SettingsContentSkeleton />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  await requireAppNotExpired();
  const session = await requirePageAuth();
  const sections = getSettingsSections();

  return (
    <div className="mx-auto max-w-full">
      <div className="flex gap-8">
        <SettingsNavigation sections={sections} />
        <div className="min-w-0 flex-1 space-y-6">
          <Suspense fallback={<VersionSectionSkeleton />}>
            <VersionSection />
          </Suspense>
          <Suspense fallback={<SettingsCardSkeleton rows={1} />}>
            <UserManagementSection
              userId={session.user.userId}
              username={session.user.username}
            />
          </Suspense>
          <Suspense fallback={<SettingsCardSkeleton rows={2} />}>
            <ConfigurationSection />
          </Suspense>
          <Suspense fallback={<SettingsCardSkeleton rows={3} />}>
            <InterviewSettingsSection />
          </Suspense>
          <PrivacySection />
          <Suspense fallback={<SettingsCardSkeleton rows={2} />}>
            <ApiTokensSection />
          </Suspense>
          <Suspense fallback={<SettingsCardSkeleton rows={2} />}>
            <PreviewModeSection />
          </Suspense>
          {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
            <DeveloperToolsSection />
          )}
        </div>
      </div>
    </div>
  );
}
