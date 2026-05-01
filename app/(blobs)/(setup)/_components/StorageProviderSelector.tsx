'use client';

import { useState } from 'react';
import type { RichSelectOption } from '@codaco/fresco-ui/form/fields/RichSelectGroup';
import RichSelectGroupField from '@codaco/fresco-ui/form/fields/RichSelectGroup';
import { S3ConfigForm } from './S3ConfigForm';
import { UploadThingTokenForm } from './UploadThingTokenForm';

type Provider = 'uploadthing' | 's3';

const providerOptions: RichSelectOption[] = [
  {
    value: 'uploadthing',
    label: 'UploadThing',
    description:
      'Third-party managed storage. Easy to set up — just paste your API token.',
  },
  {
    value: 's3',
    label: 'S3 / S3-Compatible',
    description:
      'Self-hosted or cloud object storage (AWS S3, MinIO, Cloudflare R2, Backblaze B2).',
  },
];

export default function StorageProviderSelector() {
  const [selected, setSelected] = useState<Provider>('uploadthing');

  return (
    <div className="flex flex-col gap-6">
      <RichSelectGroupField
        options={providerOptions}
        value={selected}
        onChange={(value) => setSelected(value as Provider)}
        orientation="horizontal"
        size="md"
      />

      {selected === 'uploadthing' && <UploadThingTokenForm />}
      {selected === 's3' && <S3ConfigForm />}
    </div>
  );
}
