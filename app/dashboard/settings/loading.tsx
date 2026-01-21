import { SettingsSectionSkeleton } from '~/components/layout/SettingsSection';
import { SettingsCardSkeleton } from '~/components/settings/SettingsCard';
import PageHeader from '~/components/typography/PageHeader';
import { Skeleton } from '~/components/ui/skeleton';
import { env } from '~/env';

function NavigationSkeleton() {
  const itemCount =
    4 + (env.PREVIEW_MODE ? 1 : 0) + (env.NODE_ENV === 'development' || !env.SANDBOX_MODE ? 1 : 0);

  return (
    <nav className="sticky top-6 hidden h-fit w-48 shrink-0 lg:block">
      <div className="space-y-1">
        {Array.from({ length: itemCount }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-sm" />
        ))}
      </div>
    </nav>
  );
}

export default function Loading() {
  return (
    <>
      <PageHeader
        headerText="Settings"
        subHeaderText="Here you can configure your installation of Fresco."
      />
      <div className="flex gap-8">
        <NavigationSkeleton />
        <div className="min-w-0 flex-1 space-y-6">
          <SettingsSectionSkeleton />

          <SettingsCardSkeleton rows={2} />

          <SettingsCardSkeleton rows={3} />

          <SettingsCardSkeleton rows={1} />

          {env.PREVIEW_MODE && <SettingsCardSkeleton rows={2} />}

          {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
            <SettingsCardSkeleton rows={3} />
          )}
        </div>
      </div>
    </>
  );
}
