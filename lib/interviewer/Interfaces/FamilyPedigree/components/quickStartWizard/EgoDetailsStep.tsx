'use client';

import { useSelector } from 'react-redux';
import Paragraph from '~/components/typography/Paragraph';
import Field from '~/lib/form/components/Field/Field';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import {
  getBiologicalSexOptions,
  getNodeForm,
  getNodeType,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function EgoDetailsStep() {
  const sexOptions = useSelector(getBiologicalSexOptions);
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
    <>
      <Paragraph>
        Before we begin, we need to ask a few questions about you.
      </Paragraph>
      <Field
        name="ego-sex-at-birth"
        label="What is your sex assigned at birth?"
        component={RadioGroupField}
        options={sexOptions}
        required
      />
      {fieldComponents}
    </>
  );
}
