import { useCallback, useState } from 'react';
import { updateEgo } from '~/lib/interviewer/ducks/modules/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { Button } from '~/lib/ui/components';
import { Radio, RadioGroup } from '~/lib/ui/components/Fields';
import NumberInput from '~/lib/ui/components/Fields/Number';
import Overlay from '../../../Overlay';
import { useFamilyTreeStore } from '../FamilyTreeProvider';

type CensusFormProps = {
  sexVariable?: string;
};

export const CensusForm = ({ sexVariable }: CensusFormProps) => {
  const [show, setShow] = useState(true);

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

  const sexOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
  ];
  type Sex = 'male' | 'female';
  const [sexValue, setSexValue] = useState<Sex>('female');

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

  const dispatch = useAppDispatch();
  const updateNode = useFamilyTreeStore((state) => state.updateNode);
  const saveEgoSex = useCallback(() => {
    void dispatch(updateEgo({ sex: sexValue }));
    updateNode('ego', { interviewNetworkId: 'ego', sex: sexValue });
  }, [dispatch, sexValue, updateNode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fieldValueMap = fields.reduce(
      (acc, field) => {
        // Convert string value to number, defaulting to 0 if empty
        acc[field.variable] =
          field.value === '' ? 0 : parseInt(field.value, 10) || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    generatePlaceholderNetwork(fieldValueMap, sexValue);
    saveEgoSex();
    setShow(false);
  };

  return (
    <Overlay
      show={show}
      title="Family Tree Census"
      onClose={() => setShow(false)}
      forceDisableFullscreen
      className="!w-auto"
    >
      <div className="flex flex-col">
        {sexVariable && (
          <div className="mb-6 w-full *:mb-0!">
            <RadioGroup
              optionComponent={Radio}
              input={{
                name: 'sex',
                value: sexValue,
                onChange: (value: string) => setSexValue(value as Sex),
              }}
              label="What is your sex?"
              options={sexOptions}
            />
          </div>
        )}
        <div className="w-full gap-6 *:mb-0! md:grid md:grid-cols-2">
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
        <div className="mb-8 flex items-center justify-end">
          <Button onClick={handleSubmit}>Generate Family Tree</Button>
        </div>
      </div>
    </Overlay>
  );
};
