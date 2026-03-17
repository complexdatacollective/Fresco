import type { Form as TForm } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
} from '@codaco/shared-consts';
import { forwardRef, useImperativeHandle } from 'react';
import Surface from '~/components/layout/Surface';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { type FieldValue } from '~/lib/form/components/Field/types';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import { useFormMeta } from '~/lib/form/hooks/useFormState';
import useFormStore from '~/lib/form/hooks/useFormStore';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import Node from '../../components/Node';
import { type Subject } from '../../selectors/forms';

export type SlideFormHandle = {
  submitForm: () => Promise<void>;
  validateForm: () => Promise<boolean>;
  isValid: boolean;
  isDirty: boolean;
};

type SlideFormNodeProps = {
  form: TForm;
  item: NcNode;
  onUpdate?: (args: {
    nodeId: string;
    newAttributeData: Record<string, unknown>;
  }) => void;
  onScroll?: () => (
    scrollTop: number,
    clampedScrollAmount: number,
    scrollAmount: number,
  ) => void;
  submitButton?: React.ReactNode;
  otherNetworkEntities?: (NcNode | NcEdge | NcEgo)[];
};

// Inner component that uses form hooks (must be inside FormStoreProvider)
const SlideFormNodeInner = forwardRef<SlideFormHandle, SlideFormNodeProps>(
  function SlideFormNodeInner(
    {
      form,
      item,
      submitButton = (
        <button type="submit" key="submit" aria-label="Submit" hidden />
      ),
      onUpdate,
    },
    ref,
  ) {
    const id = item[entityPrimaryKeyProperty];
    const rawAttributes = item[entityAttributesProperty];

    // Expose form methods to parent via ref
    const { isValid, isDirty } = useFormMeta();
    const submitForm = useFormStore((s) => s.submitForm);
    const validateForm = useFormStore((s) => s.validateForm);

    useImperativeHandle(
      ref,
      () => ({
        submitForm,
        validateForm,
        isValid,
        isDirty,
      }),
      [submitForm, validateForm, isValid, isDirty],
    );

    // Derive subject from the node item
    const subject: Subject = { entity: 'node', type: item.type };

    // Convert null values to undefined for form compatibility
    const initialValues: Record<string, FieldValue> | undefined = rawAttributes
      ? (Object.fromEntries(
          Object.entries(rawAttributes).map(([key, value]) => [
            key,
            value ?? undefined,
          ]),
        ) as Record<string, FieldValue>)
      : undefined;

    // Convert protocol form fields to React components
    const { fieldComponents } = useProtocolForm({
      fields: form.fields,
      autoFocus: false,
      initialValues,
      subject,
    });

    const handleSubmit: FormSubmitHandler = (values) => {
      onUpdate?.({
        nodeId: id,
        newAttributeData: values as Record<string, unknown>,
      });
      return { success: true as const };
    };

    return (
      <div className="flex size-full items-center justify-center">
        <div
          className="relative flex min-h-5 w-full max-w-[65rem] flex-col rounded-[--nc-border-radius] bg-[--nc-panel-bg-muted] px-5 pt-2.5 pb-5"
          style={
            {
              '--base-node-size': '7.8rem',
              'maxHeight': '80%',
            } as React.CSSProperties
          }
        >
          <Node
            {...item}
            className="absolute top-[calc(var(--base-node-size)*-0.5)] left-[calc(50%-var(--base-node-size)/2)] rounded-full bg-[--nc-panel-bg-muted]"
          />
          <div className="mt-[calc(var(--base-node-size)*0.4)] flex flex-1 min-h-0 w-full flex-col">
            <ScrollArea className="h-auto">
              <Surface>
                <FormWithoutProvider
                  onSubmit={handleSubmit}
                  className="[&_.form-field-container]:break-inside-avoid"
                >
                  {fieldComponents}
                  {submitButton}
                </FormWithoutProvider>
              </Surface>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  },
);

// Wrapper component that provides isolated FormStoreProvider per slide
const SlideFormNode = forwardRef<SlideFormHandle, SlideFormNodeProps>(
  function SlideFormNode(props, ref) {
    return (
      <FormStoreProvider>
        <SlideFormNodeInner ref={ref} {...props} />
      </FormStoreProvider>
    );
  },
);

export default SlideFormNode;
