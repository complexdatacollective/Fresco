import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { type z } from 'zod';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import ReadOnlyEnvAlert from '../settings/ReadOnlyEnvAlert';

export default function UpdateSettingsValue<T extends string>({
  initialValue,
  updateValue,
  schema,
  readOnly,
}: {
  initialValue?: T;
  updateValue: (value: T) => Promise<unknown>;
  schema: z.ZodSchema<T>;
  readOnly?: boolean;
}) {
  const [newValue, setNewValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  // If key is empty or invalid, set the error state
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

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
    await updateValue(newValue);
    setSaving(false);
  };

  return (
    <>
      {readOnly && <ReadOnlyEnvAlert />}
      <Input
        value={newValue}
        onChange={handleChange}
        onFocus={(event) => event.target.select()}
        type="text"
        error={error}
        className="w-full"
        disabled={readOnly ?? isSaving}
      />
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
