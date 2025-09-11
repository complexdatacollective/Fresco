import { type NcNode } from '@codaco/shared-consts';
import { useEffect } from 'react';
import { reduxForm, type InjectedFormProps } from 'redux-form';
import { Field, Form } from '~/lib/form';
import { InputField } from '~/lib/form/components/fields/Input';
import { validations } from '~/lib/form/validation';
import Button from '~/lib/ui/components/Button';
import { MarkdownLabel } from '~/lib/ui/components/Fields';
import Node from '../../components/Node';

type FormValues = {
  otherVariable: string;
};

type OtherVariableFormOwnProps = {
  node: NcNode;
  prompt: string;
  onCancel: () => void;
  initialValues: FormValues;
};

type OtherVariableFormProps = OtherVariableFormOwnProps &
  InjectedFormProps<FormValues, OtherVariableFormOwnProps>;

const OtherVariableForm = ({
  node,
  prompt,
  handleSubmit,
  onCancel,
  initialValues,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  initialize,
}: OtherVariableFormProps) => {
  useEffect(() => {
    initialize(initialValues);
    // Causes infinite loop if deps are included
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="other-variable-form" onClick={(e) => e.stopPropagation()}>
      <Form onSubmit={handleSubmit}>
        <div className="other-variable-form__content">
          <div className="other-variable-form__content-left">
            <Node {...node} />
          </div>
          <div className="other-variable-form__content-right">
            <h4>
              <MarkdownLabel inline label={prompt} />
            </h4>
            <Field
              label=""
              placeholder="Enter your response here..."
              component={InputField}
              name="otherVariable"
              validation={validations.required()}
            />
          </div>
        </div>
        <div className="other-variable-form__footer">
          <Button type="button" color="white" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" aria-label="Submit">
            Continue
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default reduxForm<FormValues, OtherVariableFormOwnProps>({
  form: 'otherVariableForm',
})(OtherVariableForm);
