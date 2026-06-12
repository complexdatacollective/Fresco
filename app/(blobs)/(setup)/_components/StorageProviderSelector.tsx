'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@codaco/fresco-ui/Alert';
import type { RichSelectOption } from '@codaco/fresco-ui/form/fields/RichSelectGroup';
import RichSelectGroupField from '@codaco/fresco-ui/form/fields/RichSelectGroup';
import { type StorageEnvStatus } from '~/lib/storage/config';
import { type S3EnvValues } from '~/schemas/s3Settings';
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

const providerLabels: Record<Provider, string> = {
  uploadthing: 'UploadThing',
  s3: 'S3 / S3-Compatible',
};

export default function StorageProviderSelector({
  envStatus,
  s3EnvValues,
}: {
  envStatus: StorageEnvStatus;
  s3EnvValues: S3EnvValues | null;
}) {
  const [selected, setSelected] = useState<Provider>(
    envStatus.pinnedProvider ?? 'uploadthing',
  );

  const pinned = Boolean(envStatus.pinnedProvider);

  const selectedEnvManaged =
    selected === 's3'
      ? envStatus.s3EnvManaged
      : envStatus.uploadThingEnvManaged;

  const options = pinned
    ? providerOptions.map((option) => ({ ...option, disabled: true }))
    : providerOptions;

  return (
    <div className="flex flex-col">
      {envStatus.pinnedProvider && (
        <Alert variant="info">
          <AlertDescription>
            The storage provider is set to{' '}
            {providerLabels[envStatus.pinnedProvider]} via the STORAGE_PROVIDER
            environment variable.
          </AlertDescription>
        </Alert>
      )}

      <RichSelectGroupField
        options={options}
        value={selected}
        onChange={(value) => {
          if (value === 'uploadthing' || value === 's3') {
            setSelected(value);
          }
        }}
        orientation="horizontal"
        size="md"
      />

      {selected === 'uploadthing' && (
        <>
          <hr />
          <UploadThingTokenForm disabled={selectedEnvManaged} />
        </>
      )}
      {selected === 's3' && (
        <>
          <hr />
          <S3ConfigForm
            disabled={selectedEnvManaged}
            defaultValues={s3EnvValues ?? undefined}
          />
        </>
      )}
    </div>
  );
}
