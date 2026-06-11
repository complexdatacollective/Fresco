'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import type { RichSelectOption } from '@codaco/fresco-ui/form/fields/RichSelectGroup';
import RichSelectGroupField from '@codaco/fresco-ui/form/fields/RichSelectGroup';
import { setStorageProvider } from '~/actions/storageProvider';
import { type StorageEnvStatus } from '~/lib/storage/config';
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
}: {
  envStatus: StorageEnvStatus;
}) {
  const [selected, setSelected] = useState<Provider>(
    envStatus.pinnedProvider ?? 'uploadthing',
  );

  const selectedEnvManaged =
    selected === 's3'
      ? envStatus.s3EnvManaged
      : envStatus.uploadThingEnvManaged;

  return (
    <div className="flex flex-col gap-6">
      {envStatus.pinnedProvider ? (
        <Alert variant="info">
          <AlertDescription>
            The storage provider is set to{' '}
            {providerLabels[envStatus.pinnedProvider]} via the STORAGE_PROVIDER
            environment variable.
          </AlertDescription>
        </Alert>
      ) : (
        <RichSelectGroupField
          options={providerOptions}
          value={selected}
          onChange={(value) => {
            if (value === 'uploadthing' || value === 's3') {
              setSelected(value);
            }
          }}
          orientation="horizontal"
          size="md"
        />
      )}

      {selectedEnvManaged ? (
        <EnvManagedContinue provider={selected} />
      ) : (
        <>
          {selected === 'uploadthing' && <UploadThingTokenForm />}
          {selected === 's3' && <S3ConfigForm />}
        </>
      )}
    </div>
  );
}

function EnvManagedContinue({ provider }: { provider: Provider }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Persists the provider selection; a no-op when STORAGE_PROVIDER
      // already pins this provider.
      const result = await setStorageProvider(provider);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push('/setup?step=3');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'An unexpected error occurred',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Alert variant="info">
        <AlertDescription>
          Storage credentials for {providerLabels[provider]} are configured via
          environment variables, so there is nothing to enter here.
        </AlertDescription>
      </Alert>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button
        onClick={handleContinue}
        color="primary"
        disabled={isSubmitting}
        className="self-start"
      >
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
}
