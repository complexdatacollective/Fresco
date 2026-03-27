'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import Field from '~/lib/form/components/Field/Field';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import { type FieldValue } from '~/lib/form/components/Field/types';
import { type CustomFieldValidation } from '~/lib/form/store/types';
import {
  getBiologicalSexOptions,
  getNodeForm,
  getNodeType,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

type PersonFieldsProps = {
  namespace?: string;
  initial?: {
    name?: string;
    sex?: string;
    /** Initial values for custom protocol form fields, keyed by variable ID. */
    attributes?: Record<string, unknown>;
  };
  nameRequired?: boolean;
  namePlaceholder?: string;
  sexCustomValidation?: CustomFieldValidation | CustomFieldValidation[];
  /**
   * When true, renders an "I know this person's name" toggle that controls
   * whether the name field is visible. The initial toggle state is derived
   * from `initial.name` — if a name exists, the toggle starts on.
   *
   * When false or omitted, the name field is always shown.
   */
  nameToggle?: boolean;
};

function prefixed(namespace: string | undefined, field: string) {
  return namespace ? `${namespace}-${field}` : field;
}

export default function PersonFields({
  namespace,
  initial,
  nameRequired = true,
  namePlaceholder = 'Enter name',
  sexCustomValidation,
  nameToggle = true,
}: PersonFieldsProps) {
  const sexOptions = useSelector(getBiologicalSexOptions);
  const nodeType = useSelector(getNodeType);
  const nodeForm = useSelector(getNodeForm);
  const [nameKnown, setNameKnown] = useState(
    nameToggle ? Boolean(initial?.name) : true,
  );

  const { fieldComponents } = useProtocolForm({
    subject: {
      entity: 'node',
      type: nodeType,
    },
    fields: nodeForm ?? [],
    namespace,
    initialValues: initial?.attributes as
      | Record<string, FieldValue>
      | undefined,
  });

  return (
    <>
      {nameToggle && (
        <UnconnectedField
          inline
          name={prefixed(namespace, 'nameKnown')}
          label="I know this person's name"
          component={ToggleField}
          value={nameKnown}
          onChange={(v) => {
            setNameKnown(v ?? false);
          }}
        />
      )}
      {nameKnown && (
        <Field
          name={prefixed(namespace, 'name')}
          label="Name"
          component={InputField}
          placeholder={namePlaceholder}
          autoFocus
          initialValue={initial?.name ?? ''}
          required={nameRequired}
        />
      )}
      <Field
        name={prefixed(namespace, 'sex')}
        label="Sex assigned at birth"
        component={RadioGroupField}
        options={sexOptions}
        initialValue={initial?.sex}
        required
        custom={sexCustomValidation}
        validateOnChange
      />
      {fieldComponents}
    </>
  );
}
