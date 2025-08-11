/**
 * Input Array Field component that manages an array of text inputs
 */
import { useId, useState } from 'react';

import { MenuIcon, PenIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { Button } from '~/components/ui/Button';
import { type BaseFieldProps } from '../../types';
import { getInputState } from '../../utils/getInputState';
import FieldErrors from '../FieldErrors';
import Hint from '../Hint';
import { Label } from '../Label';
import { InputField } from './Input';
import { containerVariants, inputVariants } from './shared';

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
  value,
  label,
  hint,
  placeholder = 'Enter text',
  addButtonText = 'Add Item',
  className,
  meta,
  validation,
  onChange,
}: InputArrayFieldProps) {
  const id = useId();

  const showError =
    !meta.isValid && meta.isTouched && meta.errors && meta.errors.length > 0;

  const inputVariantState = getInputState(meta);

  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Update isTouched state when the field is interacted with

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

  return (
    <div className={containerVariants({ state: inputVariantState, className })}>
      <Label htmlFor={id}>{label}</Label>
      {hint && (
        <Hint id={`${id}-hint`} validation={validation}>
          {hint}
        </Hint>
      )}

      <div className={inputVariants({ state: inputVariantState })}>
        {value && value.length > 0 && (
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

      <FieldErrors id={`${id}-error`} errors={meta.errors} show={!!showError} />
    </div>
  );
}
