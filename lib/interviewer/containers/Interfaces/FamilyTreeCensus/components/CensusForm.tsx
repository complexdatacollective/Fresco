import { type Stage } from '@codaco/protocol-validation';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useFamilyTreeStore } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { getEgoSexVariable } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/utils/nodeUtils';
import Overlay from '~/lib/interviewer/containers/Overlay';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
import { updateEgo } from '~/lib/interviewer/ducks/modules/session';
import { getNetworkEgo } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { Button } from '~/lib/ui/components';
import { Radio, RadioGroup } from '~/lib/ui/components/Fields';
import NumberInput from '~/lib/ui/components/Fields/Number';

export const CensusForm = ({
  showForm = true,
}: {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
  showForm: boolean;
}) => {
  const [show, setShow] = useState(showForm);

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
    {
      variable: 'fathers-additional-partners',
      label: 'How many other partners (current or past) does your father have?',
      value: '',
      error: null,
    },
    {
      variable: 'mothers-additional-partners',
      label: 'How many other partners (current or past) does your mother have?',
      value: '',
      error: null,
    },
  ]);

  const ego = useSelector(getNetworkEgo);
  const codebook = useSelector(getCodebook);
  const egoSexVariable = useSelector(getEgoSexVariable);
  const existingSex = egoSexVariable
    ? (ego?.attributes?.[egoSexVariable] as string | undefined)
    : undefined;

  type SexOption = { value: string; label: string };
  const variableDef = egoSexVariable
    ? (codebook?.ego?.variables?.[egoSexVariable] as {
        name?: string;
        options?: SexOption[];
      })
    : undefined;

  type Sex = 'male' | 'female';
  const [sexValue, setSexValue] = useState<Sex>(
    (existingSex as Sex) ?? 'female',
  );
  const shouldAskSex = egoSexVariable && existingSex == null;

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
  const getNodeIdFromRelationship = useFamilyTreeStore(
    (state) => state.getNodeIdFromRelationship,
  );
  const updateNode = useFamilyTreeStore((state) => state.updateNode);
  const saveEgoSex = useCallback(() => {
    if (!egoSexVariable) return;
    void dispatch(updateEgo({ [egoSexVariable]: sexValue }));
    const egoNodeId = getNodeIdFromRelationship('ego');
    if (egoNodeId != null) {
      updateNode(egoNodeId, { [egoSexVariable]: sexValue });
    }
  }, [
    dispatch,
    sexValue,
    updateNode,
    getNodeIdFromRelationship,
    egoSexVariable,
  ]);

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
        {shouldAskSex && variableDef?.options && (
          <div className="mb-6 w-full *:mb-0!">
            <RadioGroup
              optionComponent={Radio}
              input={{
                name: egoSexVariable,
                value: sexValue,
                onChange: (value: string) => setSexValue(value as Sex),
              }}
              label={'What is your sex?'}
              options={variableDef.options}
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
