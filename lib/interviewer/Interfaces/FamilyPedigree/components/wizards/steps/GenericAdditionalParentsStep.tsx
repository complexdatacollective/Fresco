'use client';

import { useSelector } from 'react-redux';
import Surface from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import Field from '@codaco/fresco-ui/form/Field/Field';
import FieldNamespace from '@codaco/fresco-ui/form/FieldNamespace';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import RadioGroupField from '@codaco/fresco-ui/form/fields/RadioGroup';
import { useFormValue } from '@codaco/fresco-ui/form/hooks/useFormValue';
import useProtocolForm from '~/lib/interviewer/forms/useProtocolForm';
import {
  getNodeForm,
  getNodeType,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

const PARENT_ROLE_OPTIONS = [
  { value: 'step-parent', label: 'Step-parent' },
  { value: 'adoptive-parent', label: 'Adoptive parent' },
  { value: 'raised-them', label: 'Parent who raised them' },
];

function AdditionalParentFields({ index }: { index: number }) {
  const nodeType = useSelector(getNodeType);
  const nodeForm = useSelector(getNodeForm);

  const { fieldComponents } = useProtocolForm({
    subject: {
      entity: 'node',
      type: nodeType,
    },
    fields: nodeForm ?? [],
  });

  return (
    <Surface level={1} spacing="sm">
      <FieldNamespace prefix={`additional-parent[${String(index)}]`}>
        <Heading level="h3">Additional Parent {index + 1}</Heading>
        <Field
          name="role"
          label="What role did this parent have?"
          component={RadioGroupField}
          options={PARENT_ROLE_OPTIONS}
          required
        />
        <Field
          name="name"
          label="What is their name?"
          component={InputField}
          autoFocus
          required
        />
        {fieldComponents}
      </FieldNamespace>
    </Surface>
  );
}

export default function GenericAdditionalParentsStep() {
  const { otherParentCount } = useFormValue(['otherParentCount']);
  const count = Number(otherParentCount ?? 0);

  return (
    <>
      <Paragraph>
        Please tell us about each of this person&apos;s additional parents. This
        includes step-parents, adoptive parents, or other people who played a
        parental role in their life.
      </Paragraph>
      <div className="flex flex-col gap-6">
        {Array.from({ length: count }, (_, i) => (
          <AdditionalParentFields key={i} index={i} />
        ))}
      </div>
    </>
  );
}
