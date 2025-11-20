'use client';

import z from 'zod';
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
      key="installationId"
      initialValue={installationId}
      readOnly={readOnly}
      schema={z.string().min(1, 'Installation ID cannot be empty')}
    />
  );
}
