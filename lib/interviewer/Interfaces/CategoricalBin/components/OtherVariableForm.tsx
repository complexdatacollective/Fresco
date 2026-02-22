import { type NcNode } from '@codaco/shared-consts';
import Button from '~/components/ui/Button';
import Dialog, { DialogFooter } from '~/lib/dialogs/Dialog';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import Node from '~/lib/interviewer/components/Node';

type FormValues = {
  otherVariable: string;
};

type OtherVariableFormProps = {
  open: boolean;
  node: NcNode;
  title: string;
  prompt: string;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  initialValue: string;
};

const OtherVariableForm = ({
  open,
  node,
  title,
  prompt,
  onSubmit,
  onClose,
  initialValue,
}: OtherVariableFormProps) => {
  const handleSubmit = (data: unknown) => {
    onSubmit(data as FormValues);
    return { success: true as const };
  };

  return (
    <FormStoreProvider>
      <Dialog
        open={open}
        closeDialog={onClose}
        title={title}
        footer={
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="other-variable-form"
              color="primary"
              aria-label="Submit"
            >
              Continue
            </Button>
          </DialogFooter>
        }
      >
        <FormWithoutProvider onSubmit={handleSubmit} id="other-variable-form">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <Node {...node} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Field
                label={prompt}
                placeholder="Enter your response here..."
                component={InputField}
                name="otherVariable"
                initialValue={initialValue}
                required
              />
            </div>
          </div>
        </FormWithoutProvider>
      </Dialog>
    </FormStoreProvider>
  );
};

export default OtherVariableForm;
