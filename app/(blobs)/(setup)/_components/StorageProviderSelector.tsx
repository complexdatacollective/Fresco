'use client';

import { useState } from 'react';
import { cx } from '~/utils/cva';
import { S3ConfigForm } from './S3ConfigForm';
import { UploadThingTokenForm } from './UploadThingTokenForm';

type Provider = 'uploadthing' | 's3';

const providers = [
  {
    id: 'uploadthing' as const,
    label: 'UploadThing',
    description: 'Third-party managed storage. Easy to set up.',
  },
  {
    id: 's3' as const,
    label: 'S3 / S3-Compatible',
    description:
      'Self-hosted or cloud object storage (AWS S3, MinIO, Cloudflare R2, Backblaze B2).',
  },
];

export default function StorageProviderSelector() {
  const [selected, setSelected] = useState<Provider>('uploadthing');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => setSelected(provider.id)}
            className={cx(
              'flex flex-1 flex-col rounded-lg border-2 p-4 text-left transition-colors',
              selected === provider.id
                ? 'border-primary bg-primary/5'
                : 'border-primary/20 hover:border-primary/50',
            )}
          >
            <span className="font-semibold">{provider.label}</span>
            <span className="mt-1 text-sm text-current/60">
              {provider.description}
            </span>
          </button>
        ))}
      </div>

      {selected === 'uploadthing' && <UploadThingTokenForm />}
      {selected === 's3' && <S3ConfigForm />}
    </div>
  );
}
