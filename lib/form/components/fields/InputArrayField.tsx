/**
 * Input Array Field component that manages an array of text inputs
 */
import { useState } from 'react';

import { MenuIcon, PenIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { Button } from '~/components/ui/Button';
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
      className="bg-card rounded border p-3 shadow-sm"
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
            />
            <Button
              size="sm"
              variant="text"
              name="save"
              onClick={handleEditSave}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Save</span>
              <PlusIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="text"
              name="cancel"
              onClick={handleEditCancel}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Cancel</span>
              <TrashIcon className="h-4 w-4 text-red-600" />
            </Button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm">{value}</span>
            <Button
              size="sm"
              variant="text"
              name="edit"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Edit</span>
              <PenIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="text"
              name="delete"
              onClick={handleDelete}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Delete</span>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </Reorder.Item>
  );
}

type InputArrayFieldProps = BaseFieldProps & {
  placeholder?: string;
  addButtonText?: string;
};

export function InputArrayField({
  value,
  label: _label,
  hint: _hint,
  placeholder,
  addButtonText = 'Add Item',
  onChange,
}: InputArrayFieldProps) {
  const [newItem, setNewItem] = useState('');

  // Ensure value is treated as string array or empty array
  const arrayValue = Array.isArray(value)
    ? (value.filter((item) => typeof item === 'string') as string[])
    : [];

  // Add item by appending to the existing value
  const handleAddItem = () => {
    if (newItem.trim()) {
      const newValue = [...arrayValue, newItem.trim()];
      onChange?.(newValue);
      setNewItem('');
    }
  };

  const handleDeleteItem = (index: number) => {
    const newValue = arrayValue.filter((_, i) => i !== index);
    onChange?.(newValue);
  };

  return (
    <div>
      {arrayValue.length > 0 && (
        <Reorder.Group
          values={arrayValue}
          onReorder={(newOrder) => onChange?.(newOrder)}
          className="space-y-2"
        >
          <AnimatePresence>
            {arrayValue.map((item, index) => (
              <Item
                key={item}
                value={item}
                handleUpdate={(newValue) => {
                  const newValueArray = [...arrayValue];
                  newValueArray[index] = newValue;
                  onChange?.(newValueArray);
                }}
                handleDelete={() => handleDeleteItem(index)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Add new item */}

      <input
        type="text"
        value={newItem}
        placeholder={placeholder}
        onChange={(e) => setNewItem(e.target.value)}
      />
      <Button onClick={handleAddItem} disabled={!newItem.trim()}>
        {addButtonText}
      </Button>
    </div>
  );
}
