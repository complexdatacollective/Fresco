'use client';

import { useSelector } from 'react-redux';
import Field from '@codaco/fresco-ui/form/Field/Field';
import { type FieldValue } from '@codaco/fresco-ui/form/Field/types';
import FieldNamespace from '@codaco/fresco-ui/form/FieldNamespace';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import useProtocolForm from '~/lib/interviewer/forms/useProtocolForm';
import {
  getNodeForm,
  getNodeType,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

type PersonFieldsProps = {
  namespace?: string;
  initial?: {
    name?: string;
    /** Initial values for custom protocol form fields, keyed by variable ID. */
    attributes?: Record<string, unknown>;
  };
  namePlaceholder?: string;
};

export default function PersonFields({
  namespace,
  initial,
  namePlaceholder = 'Enter name',
}: PersonFieldsProps) {
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
      <Field
        name="name"
        label="Name"
        component={InputField}
        placeholder={namePlaceholder}
        hint="Leave blank if the name is not known"
        initialValue={initial?.name ?? ''}
      />
      {fieldComponents}
    </>
  );

  if (namespace) {
    return <FieldNamespace prefix={namespace}>{content}</FieldNamespace>;
  }

  return content;
}
