import type { Form as TForm } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import Surface from '~/components/layout/Surface';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { type FieldValue } from '~/lib/form/components/Field/types';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import Node from '../../components/Node';
import { type Subject } from '../../selectors/forms';

type SlideFormNodeProps = {
  form: TForm;
  item: NcNode;
  onUpdate?: (args: {
    nodeId: string;
    newAttributeData: Record<string, unknown>;
  }) => void;
  submitButton?: React.ReactNode;
  sentinelRef: (node: HTMLDivElement | null) => void;
};

export default function SlideFormNode({
  form,
  item,
  submitButton = (
    <button type="submit" key="submit" aria-label="Submit" hidden />
  ),
  onUpdate,
  sentinelRef,
}: SlideFormNodeProps) {
  const id = item[entityPrimaryKeyProperty];
  const rawAttributes = item[entityAttributesProperty];

  const subject: Subject = { entity: 'node', type: item.type };

  const initialValues: Record<string, FieldValue> | undefined = rawAttributes
    ? (Object.fromEntries(
        Object.entries(rawAttributes).map(([key, value]) => [
          key,
          value ?? undefined,
        ]),
      ) as Record<string, FieldValue>)
    : undefined;

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
    <div className="flex size-full flex-col items-center justify-center gap-2">
      <Node {...item} className="shrink-0 rounded-full" />
      <div className="flex min-h-0 w-full max-w-[65rem] flex-1 flex-col rounded-[--nc-border-radius] bg-[--nc-panel-bg-muted] px-5 pt-2.5 pb-5">
        <ScrollArea className="h-auto">
          <Surface>
            <FormWithoutProvider
              onSubmit={handleSubmit}
              className="[&_.form-field-container]:break-inside-avoid"
            >
              {fieldComponents}
              {submitButton}
              <div ref={sentinelRef} aria-hidden />
            </FormWithoutProvider>
          </Surface>
        </ScrollArea>
      </div>
    </div>
  );
}
