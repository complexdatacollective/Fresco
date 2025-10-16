'use client';

import { createUploadThingTokenSchema } from '~/schemas/appSettings';
import UpdateSettingsValue from '../../_components/UpdateSettingsValue';

export default function UpdateUploadThingToken({
  uploadThingKey,
}: {
  uploadThingKey?: string;
}) {
  return (
    <UpdateSettingsValue
      key="uploadThingToken"
      initialValue={uploadThingKey}
      schema={createUploadThingTokenSchema}
    />
  );
}
