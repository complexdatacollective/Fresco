import { Suspense } from 'react';
import ApiTokenManagement from '~/components/ApiTokenManagement';
import PreviewModeAuthSwitch from '~/components/PreviewModeAuthSwitch';
import PreviewModeSwitch from '~/components/PreviewModeSwitch';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { ToggleFieldSkeleton } from '~/lib/form/components/fields/ToggleField';
import { env } from '~/env';
import { getApiTokens } from '~/queries/apiTokens';
import { getPreviewMode } from '~/queries/appSettings';
import ReadOnlyEnvAlert from '../ReadOnlyEnvAlert';

export default async function PreviewModeSection() {
  const previewMode = await getPreviewMode();
  const previewModeIsReadOnly = env.PREVIEW_MODE !== undefined;

  const apiTokensPromise = previewMode ? getApiTokens() : Promise.resolve([]);

  return (
    <SettingsCard id="preview-mode" title="Preview Mode" divideChildren>
      <SettingsField
        label="Enable Preview Mode"
        description="Enable preview mode to allow uploading and testing protocols directly from Architect Web on your private instance of Fresco."
        testId="enable-preview-mode-field"
        control={
          <Suspense fallback={<ToggleFieldSkeleton />}>
            <PreviewModeSwitch />
          </Suspense>
        }
      >
        {previewModeIsReadOnly && <ReadOnlyEnvAlert />}
      </SettingsField>
      <SettingsField
        label="Authentication"
        testId="preview-mode-auth-field"
        description="When enabled, the preview protocol upload endpoint requires authentication via API token or user session. When disabled, anyone can upload preview protocols."
        control={
          <Suspense fallback={<ToggleFieldSkeleton />}>
            <PreviewModeAuthSwitch disabled={!previewMode} />
          </Suspense>
        }
      >
        <Alert variant="warning">
          <AlertTitle>Security Warning</AlertTitle>
          <AlertDescription>
            Disabling authentication allows anyone with the URL of your study to
            upload protocols. Only disable this in trusted environments.
          </AlertDescription>
        </Alert>
      </SettingsField>
      <SettingsField
        label="API Tokens"
        testId="api-tokens-field"
        description={
          <>
            API tokens are used to authenticate preview protocol uploads from
            Architect Web.
          </>
        }
      >
        <ApiTokenManagement
          tokensPromise={apiTokensPromise}
          disabled={!previewMode}
        />
      </SettingsField>
    </SettingsCard>
  );
}
