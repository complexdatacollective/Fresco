'use client';

import { createUploadThingTokenSchema } from '~/schemas/appSettings';
import UpdateSettingsValue from '../../_components/UpdateSettingsValue';

// The saved token is write-only: it is never sent back to the client, so the
// editor starts empty and only allows saving a new value.
export default function UpdateUploadThingToken() {
  return (
    <UpdateSettingsValue
      settingsKey="uploadThingToken"
      schema={createUploadThingTokenSchema}
      placeholder="•••••••• (saved token is hidden)"
    />
  );
}
