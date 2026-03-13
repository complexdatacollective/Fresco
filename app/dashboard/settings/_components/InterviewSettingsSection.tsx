import { Suspense } from 'react';
import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch';
import FreezeInterviewsSwitch from '~/components/FreezeInterviewsSwitch';
import LimitInterviewsSwitch from '~/components/LimitInterviewsSwitch';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import ToggleSmallScreenWarning from '~/components/ToggleSmallScreenWarning';
import { Alert, AlertDescription } from '~/components/ui/Alert';
import { ToggleFieldSkeleton } from '~/lib/form/components/fields/ToggleFieldSkeleton';
import { getAppSetting } from '~/queries/appSettings';

export default async function InterviewSettingsSection() {
  const disableSmallScreenOverlay = await getAppSetting(
    'disableSmallScreenOverlay',
  );

  return (
    <SettingsCard
      id="interview-settings"
      title="Interview Settings"
      divideChildren
    >
      <SettingsField
        label="Anonymous Recruitment"
        description="If anonymous recruitment is enabled, you may generate an anonymous participation URL. This URL can be shared with participants to allow them to self-enroll in your study."
        testId="anonymous-recruitment-field"
        control={
          <Suspense fallback={<ToggleFieldSkeleton />}>
            <AnonymousRecruitmentSwitch />
          </Suspense>
        }
      />
      <SettingsField
        label="Limit Interviews"
        testId="limit-interviews-field"
        description={
          <>
            If this option is enabled, each participant will only be able to
            submit a single <strong>completed</strong> interview for each
            protocol (although they may have multiple incomplete interviews).
            Once an interview has been completed, attempting to start a new
            interview or to resume any other in-progress interview, will be
            prevented.
          </>
        }
        control={
          <Suspense fallback={<ToggleFieldSkeleton />}>
            <LimitInterviewsSwitch />
          </Suspense>
        }
      />
      <SettingsField
        label="Freeze Completed Interviews"
        testId="freeze-interviews-field"
        description="When enabled, completed interviews will silently reject any further data sync updates. This prevents modifications to submitted data if an interview is re-opened."
        control={
          <Suspense fallback={<ToggleFieldSkeleton />}>
            <FreezeInterviewsSwitch />
          </Suspense>
        }
      />
      <SettingsField
        label="Disable Small Screen Warning"
        description="If this option is enabled, the warning about using Fresco on a small screen will be disabled."
        control={
          <Suspense fallback={<ToggleFieldSkeleton />}>
            <ToggleSmallScreenWarning />
          </Suspense>
        }
      >
        {disableSmallScreenOverlay && (
          <Alert variant="warning">
            <AlertDescription>
              Ensure that you test your interview thoroughly on a small screen
              when disabling this warning. Fresco is designed to work best on
              larger screens, and using it on a small screen may lead to a poor
              user experience for participants.
            </AlertDescription>
          </Alert>
        )}
      </SettingsField>
    </SettingsCard>
  );
}
