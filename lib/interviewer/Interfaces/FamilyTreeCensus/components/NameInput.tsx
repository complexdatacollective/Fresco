'use client';

import { useRef, useState } from 'react';
import InputField from '~/lib/form/components/fields/InputField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import { cx } from '~/utils/cva';

type NameInputProps = {
  value: string;
  onChange: (value: string) => void;
  unknownLabel?: string;
  className?: string;
};

export default function NameInput({
  value,
  onChange,
  unknownLabel = "Don't know",
  className,
}: NameInputProps) {
  const [dontKnow, setDontKnow] = useState(value === '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (checked: boolean | undefined) => {
    const isChecked = checked ?? false;
    setDontKnow(isChecked);

    if (isChecked) {
      onChange('');
    } else {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <InputField
        ref={inputRef}
        value={dontKnow ? '' : value}
        onChange={(v) => onChange(v ?? '')}
        disabled={dontKnow}
        placeholder={dontKnow ? unknownLabel : undefined}
        layout={false}
      />
      <label className="flex items-center gap-2 text-sm">
        <ToggleField value={dontKnow} onChange={handleToggle} size="sm" />
        {unknownLabel}
      </label>
    </div>
  );
}
