import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type z from 'zod';
import { setAppSetting } from '~/actions/appSettings';
import { Button } from '~/components/ui/Button';
import { InputField } from '~/lib/form/components/fields/InputField';
import { type AppSetting } from '~/schemas/appSettings';
import ReadOnlyEnvAlert from '../settings/ReadOnlyEnvAlert';

export default function UpdateSettingsValue({
  key,
  initialValue,
  readOnly,
  schema,
}: {
  key: AppSetting;
  initialValue?: string;
  readOnly?: boolean;
  schema: z.ZodType<string>;
}) {
  const [newValue, setNewValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  // If key is empty or invalid, set the error state
  const handleChange = (value: string) => {
    const result = schema.safeParse(value);

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
    await setAppSetting(key, newValue);
    setSaving(false);
  };

  return (
    <>
      {readOnly && <ReadOnlyEnvAlert />}
      <InputField
        value={newValue}
        onChange={handleChange}
        onFocus={(event) => event.target.select()}
        type="text"
        className="w-full"
        disabled={readOnly ?? isSaving}
      />
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
      {newValue !== initialValue && (
        <div className="mt-4 flex justify-end gap-2">
          {!isSaving && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button disabled={!!error} onClick={handleSave}>
            {isSaving && <Loader2 className="mr-2 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </>
  );
}
