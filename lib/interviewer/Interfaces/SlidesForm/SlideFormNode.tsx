import type { Form as TForm } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
} from '@codaco/shared-consts';
import Surface from '~/components/layout/Surface';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { type FieldValue } from '~/lib/form/components/Field/types';
import Form from '~/lib/form/components/Form';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import { type Subject } from '../../selectors/forms';
import Node from '../../components/Node';

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

export default function SlideFormNode({
  form,
  item,
  submitButton = (
    <button type="submit" key="submit" aria-label="Submit" hidden />
  ),
  onUpdate,
  otherNetworkEntities: _otherNetworkEntities,
  onScroll: _onScroll,
}: SlideFormNodeProps) {
  const id = item[entityPrimaryKeyProperty];
  const rawAttributes = item[entityAttributesProperty];

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
        className="relative flex min-h-5 w-full max-w-[65rem] rounded-[--nc-border-radius] bg-[--nc-panel-bg-muted] px-5 pt-2.5 pb-5"
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
        <div className="mt-[calc(var(--base-node-size)*0.4)] size-full">
          <ScrollArea>
            <Surface>
              <Form
                onSubmit={handleSubmit}
                className="[&_.form-field-container]:break-inside-avoid"
              >
                {fieldComponents}
                {submitButton}
              </Form>
            </Surface>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
