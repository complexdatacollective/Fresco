'use client';

import { useSelector } from 'react-redux';
import Field from '~/lib/form/components/Field/Field';
import { type FieldValue } from '~/lib/form/components/Field/types';
import FieldGroup from '~/lib/form/components/FieldGroup';
import FieldNamespace from '~/lib/form/components/FieldNamespace';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
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

export default function PersonFields({
  namespace,
  initial,
  namePlaceholder = 'Enter name',
  sexCustomValidation,
  nameToggle = true,
}: PersonFieldsProps) {
  const sexOptions = useSelector(getBiologicalSexOptions);
  const nodeType = useSelector(getNodeType);
  const nodeForm = useSelector(getNodeForm);

  const { fieldComponents } = useProtocolForm({
    subject: {
      entity: 'node',
      type: nodeType,
    },
    fields: nodeForm ?? [],
    initialValues: initial?.attributes as
      | Record<string, FieldValue>
      | undefined,
  });

  const content = (
    <>
      {nameToggle && (
        <Field
          name="name-known"
          label="Do you know this person's name?"
          component={BooleanField}
          required
        />
      )}
      {nameToggle ? (
        <FieldGroup
          watch={['name-known']}
          condition={(values) => values['name-known'] === true}
        >
          <Field
            name="name"
            label="Name"
            component={InputField}
            placeholder={namePlaceholder}
            autoFocus
            initialValue={initial?.name ?? ''}
            required
          />
        </FieldGroup>
      ) : (
        <Field
          name="name"
          label="Name"
          component={InputField}
          placeholder={namePlaceholder}
          initialValue={initial?.name ?? ''}
          required
        />
      )}
      <Field
        name="sex-at-birth"
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

  if (namespace) {
    return <FieldNamespace prefix={namespace}>{content}</FieldNamespace>;
  }

  return content;
}
