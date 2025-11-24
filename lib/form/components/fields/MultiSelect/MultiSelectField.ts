// MultiSelectField.tsx

import { useRef, useEffect, useState } from 'react';
import type { Item } from './multi-select-input';
import './multi-select-input'; // registers the element

interface MultiSelectFieldProps {
  name: string;
  items: Item[];
  onChange: (items: Item[]) => void;
  required?: boolean;
  min?: number;
  max?: number;
}

export function MultiSelectField({ 
  name, 
  items, 
  onChange, 
  required, 
  min, 
  max 
}: MultiSelectFieldProps) {
  const ref = useRef<HTMLElement & { value: Item[] }>(null);
  const [validationMessage, setValidationMessage] = useState('');

  // Sync value to custom element
  useEffect(() => {
    if (ref.current) {
      ref.current.value = items;
    }
  }, [items]);

  // Listen for validation changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleInvalid = () => {
      setValidationMessage(el.validationMessage);
    };

    el.addEventListener('invalid', handleInvalid);
    return () => el.removeEventListener('invalid', handleInvalid);
  }, []);

  const addItem = (item: Item) => {
    onChange([...items, item]);
    setValidationMessage(''); // clear on interaction
  };

  const removeItem = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  return (
    <div>
      <multi-select-input
        ref={ref}
        name={name}
        required={required}
        min={min}
        max={max}
      />
      
      {/* Your actual UI for adding/removing items */}
      <button type="button" onClick={() => addItem({ id: crypto.randomUUID(), label: 'New Item' })}>
        Add Item
      </button>
      
      {validationMessage && (
        <span className="error">{validationMessage}</span>
      )}
    </div>
  );
}