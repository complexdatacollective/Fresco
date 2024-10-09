import ResponsiveContainer from '~/components/ResponsiveContainer';
import { SettingsSectionSkeleton } from '~/components/layout/SettingsSection';
import { ButtonSkeleton } from '~/components/ui/Button';
import { Skeleton } from '~/components/ui/skeleton';
import { SwitchSkeleton } from '~/components/ui/switch';
import PageHeader from '~/components/ui/typography/PageHeader';
import { env } from '~/env';
import { getAppSetting } from '~/queries/appSettings';

export default async function Loading() {
  const sandboxMode = await getAppSetting('sandboxMode');
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Settings"
          subHeaderText="Here you can configure your installation of Fresco."
        />
      </ResponsiveContainer>

      <ResponsiveContainer className="gap-4">
        <SettingsSectionSkeleton
          controlAreaSkelton={<Skeleton className="h-12 w-full" />}
        />
        <SettingsSectionSkeleton controlAreaSkelton={<SwitchSkeleton />} />
        <SettingsSectionSkeleton controlAreaSkelton={<SwitchSkeleton />} />
        {!sandboxMode && (
          <SettingsSectionSkeleton
            controlAreaSkelton={
              <ButtonSkeleton variant="destructive" className="w-full" />
            }
          />
        )}

        {env.NODE_ENV === 'development' && (
          <>
            <SettingsSectionSkeleton
              controlAreaSkelton={<ButtonSkeleton className="w-full" />}
            />
            <SettingsSectionSkeleton
              controlAreaSkelton={<Skeleton className="h-12 w-full" />}
            />
          </>
        )}
      </ResponsiveContainer>
    </>
  );
}
