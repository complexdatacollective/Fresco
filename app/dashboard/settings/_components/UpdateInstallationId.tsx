'use client';

import { setAppSetting } from '~/actions/appSettings';
import { appSettingsSchema } from '~/schemas/appSettings';
import UpdateSettingsValue from '../../_components/UpdateSettingsValue';

export default function UpdateInstallationId({
  installationId,
  readOnly,
}: {
  installationId?: string;
  readOnly?: boolean;
}) {
  return (
    <UpdateSettingsValue
      initialValue={installationId}
      updateValue={async (value) => {
        await setAppSetting('installationId', value);
      }}
      schema={appSettingsSchema.shape.installationId}
      readOnly={readOnly}
    />
  );
}
