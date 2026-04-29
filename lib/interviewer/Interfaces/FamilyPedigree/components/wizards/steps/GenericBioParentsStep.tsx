'use client';

import { useSelector } from 'react-redux';
import Surface from '~/components/ui/layout/Surface';
import Heading from '~/components/ui/typography/Heading';
import { Alert, AlertDescription } from '~/components/ui/Alert';
import Field from '~/components/ui/form/components/Field/Field';
import FieldGroup from '~/components/ui/form/components/FieldGroup';
import FieldNamespace from '~/components/ui/form/components/FieldNamespace';
import BooleanField from '~/components/ui/form/components/fields/Boolean';
import InputField from '~/components/ui/form/components/fields/InputField';
import useProtocolForm from '~/components/ui/form/hooks/useProtocolForm';
import {
  getNodeForm,
  getNodeType,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

export default function GenericBioParentsStep() {
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
      <div className="flex flex-col gap-6">
        <Surface level={1} spacing="sm">
          <FieldNamespace prefix="egg-parent">
            <div className="mb-8">
              <Heading level="h3">Egg Parent</Heading>
              <Alert variant="info">
                <AlertDescription>
                  The egg parent is the person who contributed the egg that this
                  person was conceived with.
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
              label="Did this parent carry them during pregnancy?"
              hint="If they were carried by a different person (e.g. a gestational carrier or surrogate), select 'No' here."
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
                this person was conceived with.
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
                    The gestational carrier is the person who carried them
                    during pregnancy but did not contribute the egg.
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
