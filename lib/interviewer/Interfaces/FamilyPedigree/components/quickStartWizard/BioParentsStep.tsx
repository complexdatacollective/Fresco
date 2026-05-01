'use client';

import { useSelector } from 'react-redux';
import Surface from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { Alert, AlertDescription } from '@codaco/fresco-ui/Alert';
import Field from '@codaco/fresco-ui/form/Field/Field';
import FieldGroup from '@codaco/fresco-ui/form/FieldGroup';
import FieldNamespace from '@codaco/fresco-ui/form/FieldNamespace';
import BooleanField from '@codaco/fresco-ui/form/fields/Boolean';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import useProtocolForm from '~/lib/interviewer/forms/useProtocolForm';
import {
  getNodeForm,
  getNodeType,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function BioParentsForm() {
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
        When building a pedigree, we need to ask you about your biological
        parents, and not just your parents in general. If you were conceived via
        an egg or sperm donor, the donor is considered your biological parent,
        even if they did not raise you.
      </Paragraph>
      <div className="flex flex-col gap-6">
        <Surface level={1} spacing="sm">
          <FieldNamespace prefix="egg-parent">
            <div className="mb-8">
              <Heading level="h3">Egg Parent</Heading>
              <Alert variant="info">
                <AlertDescription>
                  The egg parent is the person who contributed the egg that you
                  were conceived with. If you were conceived via an egg donor,
                  the egg donor is the egg parent, even if they did not carry
                  you during pregnancy.
                </AlertDescription>
              </Alert>
            </div>
            <Field
              name="name"
              label="What is their name?"
              component={InputField}
              hint="Leave blank if the name is not known"
            />
            <Field
              name="is-donor"
              label="Was this person an egg donor?"
              component={BooleanField}
              initialValue={false}
              required
            />
            <Field
              name="gestationalCarrier"
              label="Did this parent carry you during pregnancy?"
              hint="If you were carried by a different person (e.g. a gestational carrier or surrogate), select 'No' here and we'll ask you about the carrier in the next step."
              component={BooleanField}
              initialValue={true}
              required
            />
            {fieldComponents}
          </FieldNamespace>
        </Surface>
        <Surface level={1} spacing="sm">
          <FieldNamespace prefix="sperm-parent">
            <Heading level="h3">Sperm Parent</Heading>
            <Alert variant="info">
              <AlertDescription>
                The sperm parent is the person who contributed the sperm that
                you were conceived with. If you were conceived via a sperm
                donor, the sperm donor is the sperm parent, even if they did not
                raise you.
              </AlertDescription>
            </Alert>

            <Field
              name="name"
              label="What is their name?"
              component={InputField}
              hint="Leave blank if the name is not known"
            />
            <Field
              name="is-donor"
              label="Was this person a sperm donor?"
              component={BooleanField}
              initialValue={false}
              required
            />
            {fieldComponents}
          </FieldNamespace>
        </Surface>
        <FieldGroup
          watch={['egg-parent.gestationalCarrier']}
          condition={(values) =>
            values['egg-parent.gestationalCarrier'] === false
          }
        >
          <Surface level={1} spacing="sm">
            <FieldNamespace prefix="gestational-carrier">
              <div className="mb-8">
                <Heading level="h3">Gestational Carrier</Heading>
                <Alert variant="info">
                  <AlertDescription>
                    The gestational carrier is the person who carried you during
                    pregnancy but did not contribute the egg. This includes
                    gestational surrogates.
                  </AlertDescription>
                </Alert>
              </div>
              <Field
                name="is-donor"
                label="Was this person a gestational surrogate?"
                component={BooleanField}
                required
              />
              <Field
                name="name"
                label="What is their name?"
                component={InputField}
                hint="Leave blank if the name is not known"
              />
              {fieldComponents}
            </FieldNamespace>
          </Surface>
        </FieldGroup>
      </div>
    </>
  );
}
