import { Loader2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import type { z } from 'zod/mini';
import { setAppSetting } from '~/actions/appSettings';
import { Button } from '@codaco/fresco-ui/Button';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import { type AppSetting } from '~/schemas/appSettings';
import ReadOnlyEnvAlert from '../settings/ReadOnlyEnvAlert';

export default function UpdateSettingsValue({
  settingsKey,
  initialValue,
  readOnly,
  schema,
  suffixComponent,
  placeholder,
}: {
  settingsKey: AppSetting;
  initialValue?: string;
  readOnly?: boolean;
  schema: z.ZodMiniType<string>;
  suffixComponent?: ReactNode;
  placeholder?: string;
}) {
  const [newValue, setNewValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  // If settingsKey is empty or invalid, set the error state
  const handleChange = (value: string | undefined) => {
    const result = schema.safeParse(value ?? initialValue ?? '');

    if (!result.success) {
      setError(
        `Invalid: ${result.error.issues.map((e) => e.message).join(', ')}`,
      );
    } else {
      setError(null);
    }

    setNewValue(result.data);
  };

  const handleReset = () => {
    setSaving(false);
    setError(null);
    setNewValue(initialValue);
  };

  const handleSave = async () => {
    if (!newValue) return;

    setSaving(true);
    setError(null);
    try {
      await setAppSetting(settingsKey, newValue);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Failed to save setting',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {readOnly && <ReadOnlyEnvAlert />}
      <InputField
        value={newValue}
        onChange={handleChange}
        onFocus={(event) => {
          if (event.target instanceof HTMLInputElement) {
            event.target.select();
          }
        }}
        type="text"
        className="w-full"
        placeholder={placeholder}
        disabled={readOnly ?? isSaving}
        suffixComponent={suffixComponent}
      />
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
      {newValue !== initialValue && (
        <div className="mt-4 flex justify-end gap-2">
          {!isSaving && <Button onClick={handleReset}>Reset</Button>}
          <Button
            disabled={!!error || !newValue}
            onClick={handleSave}
            color="primary"
          >
            {isSaving && <Loader2 className="mr-2 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </>
  );
}
