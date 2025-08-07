/**
 * Input Array Field component that manages an array of text inputs
 */
import { useState } from 'react';

import { MenuIcon, PenIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { Button } from '~/components/ui/Button';
import { cn } from '~/utils/shadcn';
import { type BaseFieldProps } from '../../types';
import { InputField } from './Input';

function Item({
  value,
  handleUpdate,
  handleDelete,
}: {
  value: string;
  handleUpdate: (newValue: string) => void;
  handleDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const controls = useDragControls();

  const handleEditSave = () => {
    if (editValue.trim() && editValue !== value) {
      handleUpdate(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <Reorder.Item
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key={value}
      value={value}
      className="bg-card border-border rounded-md border p-3 shadow-sm"
      dragListener={false}
      dragControls={controls}
    >
      <div className="flex items-center gap-2">
        <div
          className="reorder-handle cursor-move"
          onPointerDown={(e) => controls.start(e)}
        >
          <MenuIcon />
        </div>
        {isEditing ? (
          <>
            <InputField
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleEditSave)}
              autoFocus
              meta={{
                isTouched: true,
                isValidating: false,
                errors: [],
                isDirty: true,
                isValid: true,
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditSave}
              className="h-8 w-8 p-0"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditCancel}
              className="h-8 w-8 p-0"
            >
              <TrashIcon className="h-4 w-4 text-red-600" />
            </Button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm">{value}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <PenIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 w-8 p-0"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </Reorder.Item>
  );
}

type InputArrayFieldProps = BaseFieldProps<string[]> & {
  addButtonText?: string;
};

export function InputArrayField({
  name,
  value,
  label,
  hint,
  placeholder = 'Enter text',
  addButtonText = 'Add Item',
  className,
  meta: { isTouched, isValidating, errors, isValid, isDirty },
  onChange,
}: InputArrayFieldProps) {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Add item by appending to the existing value
  const handleAddItem = () => {
    if (newItem.trim()) {
      const newValue = [...(value || []), newItem.trim()];
      onChange?.(newValue);
      setNewItem('');
    }
  };

  const handleDeleteItem = (index: number) => {
    const newValue = (value || []).filter((_, i) => i !== index);
    onChange?.(newValue);
  };

  const hasError = isTouched && errors && errors.length > 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}

      {value && value.length > 0 && (
        <div className="space-y-2">
          <Reorder.Group
            values={value}
            onReorder={onChange}
            className="space-y-2"
          >
            <AnimatePresence>
              {value.map((item, index) => (
                <Item
                  key={item}
                  value={item}
                  handleUpdate={(newValue) => {
                    const newValueArray = [...(value || [])];
                    newValueArray[index] = newValue;
                    onChange?.(newValueArray);
                  }}
                  handleDelete={() => handleDeleteItem(index)}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}

      {/* Add new item */}
      <div className="flex gap-2">
        <InputField
          type="text"
          value={newItem}
          placeholder={placeholder}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, handleAddItem)}
          meta={{
            isTouched: true,
            isValidating: false,
            errors: [],
            isDirty: true,
            isValid: true,
          }}
        />
        <Button onClick={handleAddItem} disabled={!newItem.trim()}>
          {addButtonText}
        </Button>
      </div>

      {hasError && (
        <div className="text-destructive text-sm">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
