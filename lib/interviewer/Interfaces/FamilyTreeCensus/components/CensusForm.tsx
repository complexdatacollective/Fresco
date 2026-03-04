import { type Stage } from '@codaco/protocol-validation';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import Dialog from '~/lib/dialogs/Dialog';
import Field from '~/lib/form/components/Field/Field';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import SubmitButton from '~/lib/form/components/SubmitButton';
import type { FormSubmitHandler } from '~/lib/form/store/types';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { getEgoSexVariable } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/utils/nodeUtils';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
import { updateEgo } from '~/lib/interviewer/ducks/modules/session';
import { getNetworkEgo } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';

const CENSUS_FIELDS = [
  { name: 'brothers', label: 'How many brothers do you have?' },
  { name: 'sisters', label: 'How many sisters do you have?' },
  { name: 'sons', label: 'How many sons do you have?' },
  { name: 'daughters', label: 'How many daughters do you have?' },
  {
    name: 'maternal-uncles',
    label: 'How many brothers does your mother have?',
  },
  {
    name: 'maternal-aunts',
    label: 'How many sisters does your mother have?',
  },
  {
    name: 'paternal-uncles',
    label: 'How many brothers does your father have?',
  },
  {
    name: 'paternal-aunts',
    label: 'How many sisters does your father have?',
  },
  {
    name: 'fathers-additional-partners',
    label: 'How many other partners (current or past) does your father have?',
  },
  {
    name: 'mothers-additional-partners',
    label: 'How many other partners (current or past) does your mother have?',
  },
] as const;

export const CensusForm = ({
  showForm = true,
}: {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
  showForm: boolean;
}) => {
  const [open, setOpen] = useState(showForm);

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
  const shouldAskSex = egoSexVariable && existingSex == null;

  const generatePlaceholderNetwork = useFamilyTreeStore(
    (state) => state.generatePlaceholderNetwork,
  );

  const dispatch = useAppDispatch();
  const getNodeIdFromRelationship = useFamilyTreeStore(
    (state) => state.getNodeIdFromRelationship,
  );
  const updateNode = useFamilyTreeStore((state) => state.updateNode);

  const saveEgoSex = useCallback(
    (sex: Sex) => {
      if (!egoSexVariable) return;
      void dispatch(updateEgo({ [egoSexVariable]: sex }));
      const egoNodeId = getNodeIdFromRelationship('ego');
      if (egoNodeId != null) {
        updateNode(egoNodeId, { [egoSexVariable]: sex });
      }
    },
    [dispatch, updateNode, getNodeIdFromRelationship, egoSexVariable],
  );

  const handleSubmit: FormSubmitHandler = (values) => {
    const typedValues = values as Record<string, string>;

    const fieldValueMap: Record<string, number> = {};
    for (const field of CENSUS_FIELDS) {
      const val = typedValues[field.name];
      fieldValueMap[field.name] =
        val === '' || val === undefined ? 0 : parseInt(val, 10) || 0;
    }

    const sex = (
      egoSexVariable
        ? (typedValues[egoSexVariable] ?? existingSex ?? 'female')
        : (existingSex ?? 'female')
    ) as Sex;

    generatePlaceholderNetwork(fieldValueMap, sex);
    saveEgoSex(sex);
    setOpen(false);

    return { success: true };
  };

  return (
    <FormStoreProvider>
      <Dialog
        open={open}
        title="Family Tree Census"
        closeDialog={() => setOpen(false)}
        className="w-auto!"
        footer={
          <SubmitButton form="census-form">Generate Family Tree</SubmitButton>
        }
      >
        <FormWithoutProvider id="census-form" onSubmit={handleSubmit}>
          {shouldAskSex && variableDef?.options && (
            <div className="mb-6 w-full *:mb-0!">
              <Field
                name={egoSexVariable}
                label="What is your sex?"
                component={RadioGroupField}
                options={variableDef.options satisfies SexOption[]}
                initialValue={existingSex ?? 'female'}
              />
            </div>
          )}

          <div className="w-full gap-6 *:mb-0! md:grid md:grid-cols-2">
            {CENSUS_FIELDS.map(({ name, label }) => (
              <Field
                key={name}
                name={name}
                label={label}
                component={InputField}
                type="number"
                placeholder="0"
                initialValue=""
              />
            ))}
          </div>
        </FormWithoutProvider>
      </Dialog>
    </FormStoreProvider>
  );
};
