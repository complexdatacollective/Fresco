import { useEffect, useState } from 'react';
import NumberInput from '~/lib/ui/components/Fields/Number';
import { useFamilyTreeStore } from '../FamilyTreeProvider';

export const CensusForm = () => {
  const [fields, setFields] = useState<
    {
      variable: string;
      label: string;
      value: string;
      error: string | null;
    }[]
  >([
    {
      variable: 'brothers',
      label: 'How many brothers do you have?',
      value: '',
      error: null,
    },
    {
      variable: 'sisters',
      label: 'How many sisters do you have?',
      value: '',
      error: null,
    },
    {
      variable: 'sons',
      label: 'How many sons do you have?',
      value: '',
      error: null,
    },
    {
      variable: 'daughters',
      label: 'How many daughters do you have?',
      value: '',
      error: null,
    },
    {
      variable: 'maternal-uncles',
      label: 'How many brothers does your mother have?',
      value: '',
      error: null,
    },
    {
      variable: 'maternal-aunts',
      label: 'How many sisters does your mother have?',
      value: '',
      error: null,
    },
    {
      variable: 'paternal-uncles',
      label: 'How many brothers does your father have?',
      value: '',
      error: null,
    },
    {
      variable: 'paternal-aunts',
      label: 'How many sisters does your father have?',
      value: '',
      error: null,
    },
  ]);

  const generatePlaceholderNetwork = useFamilyTreeStore(
    (state) => state.generatePlaceholderNetwork,
  );

  const handleSetFieldValue =
    (variable: string) => (value: number | string) => {
      // Convert to string for storage
      const stringValue =
        value === null || value === undefined ? '' : String(value);

      // Validate if it's a number
      if (stringValue !== '') {
        const numValue = parseInt(stringValue, 10);
        if (isNaN(numValue) || numValue < 0) {
          setFields((prevFields) =>
            prevFields.map((field) =>
              field.variable === variable
                ? {
                    ...field,
                    value: stringValue,
                    error: 'Value must be 0 or greater',
                  }
                : field,
            ),
          );
          return;
        }
      }

      setFields((prevFields) =>
        prevFields.map((field) =>
          field.variable === variable
            ? { ...field, value: stringValue, error: null }
            : field,
        ),
      );
    };

  /**
   * When the values change, we need to recalculate the placeholder nodes.
   */
  useEffect(() => {
    const fieldValueMap = fields.reduce(
      (acc, field) => {
        // Convert string value to number, defaulting to 0 if empty
        acc[field.variable] =
          field.value === '' ? 0 : parseInt(field.value, 10) || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    generatePlaceholderNetwork(fieldValueMap);
  }, [fields]);

  return (
    <div className="flex overflow-y-auto md:h-full md:items-center">
      <div className="mx-auto w-full gap-6 px-10 *:mb-0! md:grid md:max-w-5xl md:grid-cols-2">
        {fields.map(({ variable, label, error, value }) => (
          <NumberInput
            tabIndex={0}
            key={variable}
            placeholder="0"
            input={{
              name: variable,
              value: value,
              onChange: handleSetFieldValue(variable),
              onBlur: () => {
                // No-op
              },
            }}
            meta={{ error, invalid: !!error, touched: !!error }}
            label={label}
            className="mb-4"
          />
        ))}
      </div>
    </div>
  );
};
