import Surface from '~/components/layout/Surface';
import { SettingsCardSkeleton } from '~/components/settings/SettingsCard';
import PageHeader from '~/components/typography/PageHeader';
import { Skeleton } from '~/components/ui/skeleton';
import { env } from '~/env';

function NavigationSkeleton() {
  const itemCount =
    4 +
    (env.PREVIEW_MODE ? 1 : 0) +
    (env.NODE_ENV === 'development' || !env.SANDBOX_MODE ? 1 : 0);

  return (
    <Surface
      as="nav"
      spacing="sm"
      className="tablet:block sticky top-28 hidden h-fit w-48 shrink-0"
      noContainer
    >
      <Skeleton className="mb-3 h-4 w-24" />
      <div className="space-y-0.5">
        {Array.from({ length: itemCount }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full rounded-sm" />
        ))}
      </div>
    </Surface>
  );
}

export default function Loading() {
  return (
    <>
      <PageHeader
        headerText="Settings"
        subHeaderText="Here you can configure your installation of Fresco."
      />
      <div className="mx-auto max-w-6xl">
        <div className="flex gap-8">
          <NavigationSkeleton />
          <div className="min-w-0 flex-1 space-y-6">
            <SettingsCardSkeleton rows={1} />

            <SettingsCardSkeleton rows={2} />

            <SettingsCardSkeleton rows={3} />

            <SettingsCardSkeleton rows={1} />

            {env.PREVIEW_MODE && <SettingsCardSkeleton rows={2} />}

            {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
              <SettingsCardSkeleton rows={3} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
