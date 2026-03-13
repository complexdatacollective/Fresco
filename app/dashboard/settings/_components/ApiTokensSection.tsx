import { Suspense } from 'react';
import ApiTokenManagement from '~/components/ApiTokenManagement';
import InterviewDataApiSwitch from '~/components/InterviewDataApiSwitch';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import { ToggleFieldSkeleton } from '~/lib/form/components/fields/ToggleFieldSkeleton';
import { getApiTokens } from '~/queries/apiTokens';

export default function ApiTokensSection() {
  const apiTokensPromise = getApiTokens();

  return (
    <SettingsCard id="api-tokens" title="API Tokens" divideChildren>
      <SettingsField
        label="Interview Data API"
        testId="interview-data-api-field"
        description="Enable a read-only API for accessing interview data. Requires an API token for authentication."
        control={
          <Suspense fallback={<ToggleFieldSkeleton />}>
            <InterviewDataApiSwitch />
          </Suspense>
        }
      />
      <SettingsField
        label="Manage Tokens"
        testId="manage-api-tokens-field"
        description="API tokens are used to authenticate requests to the Preview Mode upload endpoint and the Interview Data API."
      >
        <ApiTokenManagement tokensPromise={apiTokensPromise} />
      </SettingsField>
    </SettingsCard>
  );
}
