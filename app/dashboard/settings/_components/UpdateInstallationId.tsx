'use client';

import z from 'zod';
import UpdateSettingsValue from '../../_components/UpdateSettingsValue';

export default function UpdateInstallationId({
  installationId,
}: {
  installationId?: string;
}) {
  return (
    <UpdateSettingsValue
      settingsKey="installationId"
      initialValue={installationId}
      schema={z.string().min(1, 'Installation ID cannot be empty')}
    />
  );
}
