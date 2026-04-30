'use client';

import { useState } from 'react';
import SettingsField from '~/components/settings/SettingsField';
import { setAppSetting } from '~/actions/appSettings';
import { Button } from '@codaco/fresco-ui/Button';
import InputField from '@codaco/fresco-ui/form/components/fields/InputField';
import { type AppSetting } from '~/schemas/appSettings';

type S3Field = {
  key: Extract<AppSetting, `s3${string}`>;
  label: string;
  type: 'text' | 'password';
};

const s3Fields: S3Field[] = [
  { key: 's3Endpoint', label: 'Endpoint URL', type: 'text' },
  { key: 's3Bucket', label: 'Bucket Name', type: 'text' },
  { key: 's3Region', label: 'Region', type: 'text' },
  { key: 's3AccessKeyId', label: 'Access Key ID', type: 'password' },
  { key: 's3SecretAccessKey', label: 'Secret Access Key', type: 'password' },
];

export default function UpdateS3Settings({
  initialValues,
}: {
  initialValues: Partial<Record<S3Field['key'], string>>;
}) {
  return (
    <>
      {s3Fields.map((field) => (
        <SettingsField key={field.key} label={field.label}>
          <S3FieldEditor
            settingsKey={field.key}
            inputType={field.type}
            initialValue={initialValues[field.key] ?? ''}
          />
        </SettingsField>
      ))}
    </>
  );
}

function S3FieldEditor({
  settingsKey,
  inputType,
  initialValue,
}: {
  settingsKey: S3Field['key'];
  inputType: 'text' | 'password';
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setSaving] = useState(false);
  const [savedValue, setSavedValue] = useState(initialValue);

  const handleSave = async () => {
    setSaving(true);
    await setAppSetting(settingsKey, value);
    setSavedValue(value);
    setSaving(false);
  };

  return (
    <div>
      <InputField
        value={value}
        onChange={(v) => setValue(v ?? '')}
        type={inputType}
        className="w-full"
        disabled={isSaving}
      />
      {value !== savedValue && (
        <div className="mt-2 flex justify-end gap-2">
          <Button
            onClick={() => {
              setValue(savedValue);
            }}
          >
            Reset
          </Button>
          <Button onClick={handleSave} color="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  );
}
