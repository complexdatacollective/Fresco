/**
 * Input Array Field component that manages an array of text inputs
 */
import { useState } from 'react';

import { Reorder } from 'motion/react';
import { Button } from '~/lib/ui/components';
import { type BaseFieldProps } from '../../types';

type InputArrayFieldProps = BaseFieldProps<string[]> & {
  addButtonText?: string;
};

export function InputArrayField({
  name,
  value,
  label,
  hint,
  validation,
  placeholder = 'Enter text',
  addButtonText = 'Add Item',
  className,
  meta: { isTouched, isValidating, errors, isValid },
  onChange,
}: InputArrayFieldProps) {
  const [newItem, setNewItem] = useState('');

  // Add item by appending to the existing value
  const handleAddItem = () => {
    console.log('Adding item:', newItem);
    const newValue = [...(value || []), newItem];
    onChange?.(newValue);
    setNewItem('');
  };

  const hasError = isTouched && errors && errors.length > 0;

  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {hint && <p className="mb-2 text-sm text-gray-500">{hint}</p>}

      <Reorder.Group axis="y" values={value} onReorder={onChange}>
        {value.map((item) => (
          <Reorder.Item key={item} value={item}>
            {item}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <input
        type="text"
        value={newItem}
        placeholder={placeholder}
        className={`w-full rounded border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none`}
        onChange={(e) => setNewItem(e.target.value)}
      />

      <Button onClick={handleAddItem}>{addButtonText}</Button>
      {hasError && (
        <div className="mt-2 text-sm text-red-600">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
