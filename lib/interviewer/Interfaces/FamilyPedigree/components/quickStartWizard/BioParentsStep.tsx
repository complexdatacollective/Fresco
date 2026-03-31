'use client';

import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Alert, AlertDescription } from '~/components/ui/Alert';
import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import FieldNamespace from '~/lib/form/components/FieldNamespace';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import {
  getBiologicalSexOptions,
  getNodeForm,
  getNodeType,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function BioParentsForm() {
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
        When building a pedigree, we need to ask you about your biological
        parents, and not just your parents in general. If you were conceived via
        an egg or sperm donor, the donor is considered your biological parent,
        even if they did not raise you.
      </Paragraph>
      <Paragraph>
        We will ask about people who raised you (e.g. adoptive parents, social
        parents) in a later step.
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
              name="is-donor"
              label="Was this person an egg donor?"
              component={BooleanField}
              required
            />
            <Field
              name="name-known"
              label="Do you know this person's name?"
              component={BooleanField}
              required
            />
            <FieldGroup
              watch={['name-known']}
              condition={(values) => values['name-known'] === true}
            >
              <Field
                name="name"
                label="What is their name?"
                component={InputField}
                autoFocus
                required
              />
            </FieldGroup>
            <Field
              name="gestationalCarrier"
              label="Did this parent carry you during pregnancy?"
              hint="If you were carried by a different person (e.g. a gestational carrier or surrogate), select 'No' here and we'll ask you about the carrier in the next step."
              component={BooleanField}
              initialValue={true}
              required
            />
            <Field
              name="raised-by"
              label="Was this person involved in raising you?"
              component={BooleanField}
              required
            />
            <Field
              name="sex-at-birth"
              label="What was this person's sex assigned at birth?"
              component={RadioGroupField}
              options={sexOptions}
              initialValue="female"
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
              name="is-donor"
              label="Was this person a sperm donor?"
              component={BooleanField}
              required
            />
            <Field
              name="name-known"
              label="Do you know this person's name?"
              component={BooleanField}
              required
            />
            <FieldGroup
              watch={['name-known']}
              condition={(values) => values['name-known'] === true}
            >
              <Field
                name="name"
                label="What is their name?"
                component={InputField}
                autoFocus
                required
              />
            </FieldGroup>
            <Field
              name="raised-by"
              label="Was this person involved in raising you?"
              component={BooleanField}
              required
            />
            <Field
              name="sex-at-birth"
              label="What was this person's sex assigned at birth?"
              component={RadioGroupField}
              options={sexOptions}
              initialValue="male"
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
                name="name-known"
                label="Do you know this person's name?"
                component={BooleanField}
                required
              />
              <FieldGroup
                watch={['name-known']}
                condition={(values) => values['name-known'] === true}
              >
                <Field
                  name="name"
                  label="What is their name?"
                  component={InputField}
                  autoFocus
                  required
                />
              </FieldGroup>
              <Field
                name="raised-by"
                label="Was this person involved in raising you?"
                component={BooleanField}
                required
              />
              <Field
                name="sex-at-birth"
                label="What was this person's sex assigned at birth?"
                component={RadioGroupField}
                options={sexOptions}
                initialValue="female"
                required
              />
              {fieldComponents}
            </FieldNamespace>
          </Surface>
        </FieldGroup>
      </div>
    </>
  );
}
