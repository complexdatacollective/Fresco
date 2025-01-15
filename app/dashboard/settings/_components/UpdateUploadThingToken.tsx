'use client';

import { setAppSetting } from '~/actions/appSettings';
import { createUploadThingTokenSchema } from '~/schemas/appSettings';
import UpdateSettingsValue from '../../_components/UpdateSettingsValue';

export default function UpdateUploadThingToken({
  uploadThingKey,
}: {
  uploadThingKey?: string;
}) {
  return (
    <UpdateSettingsValue
      initialValue={uploadThingKey}
      updateValue={async (value) => {
        await setAppSetting('uploadThingToken', value);
      }}
      schema={createUploadThingTokenSchema}
    />
  );
}
