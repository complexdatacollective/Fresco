import { type NcNode } from '@codaco/shared-consts';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Button from '~/components/ui/Button';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import Form from '~/lib/form/components/Form';
import Node from '~/lib/interviewer/components/Node';

type FormValues = {
  otherVariable: string;
};

type OtherVariableFormProps = {
  node: NcNode;
  prompt: string;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  initialValues: FormValues;
};

const OtherVariableForm = ({
  node,
  prompt,
  onSubmit,
  onCancel,
  initialValues,
}: OtherVariableFormProps) => {
  const handleSubmit = (data: unknown) => {
    onSubmit(data as FormValues);
    return { success: true as const };
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Form onSubmit={handleSubmit}>
        <div className="flex items-start gap-4 p-4">
          <div className="shrink-0">
            <Node {...node} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h4 className="text-lg font-semibold">
              <RenderMarkdown>{prompt}</RenderMarkdown>
            </h4>
            <Field
              label=""
              placeholder="Enter your response here..."
              component={InputField}
              name="otherVariable"
              initialValue={initialValues.otherVariable}
              required
            />
          </div>
        </div>
        <div className="border-outline flex justify-end gap-2 border-t p-4">
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" color="primary" aria-label="Submit">
            Continue
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default OtherVariableForm;
