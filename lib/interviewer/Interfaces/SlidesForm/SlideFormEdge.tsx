import { type Form as TForm } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
} from '@codaco/shared-consts';
import { find } from 'es-toolkit/compat';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { type FieldValue } from '~/lib/form/components/Field/types';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import { cx } from '~/utils/cva';
import Node from '../../components/Node';
import { type Subject } from '../../selectors/forms';
import { getNetworkNodes, makeGetEdgeColor } from '../../selectors/session';
import { edgeColorMap } from '../../utils/edgeColorMap';

type SlideFormEdgeProps = {
  form: TForm;
  item: NcEdge;
  submitButton?: React.ReactNode;
  onUpdate?: (args: {
    edgeId: string;
    newAttributeData: Record<string, unknown>;
  }) => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
};

export default function SlideFormEdge({
  form,
  item,
  submitButton = (
    <button type="submit" key="submit" aria-label="Submit" hidden />
  ),
  onUpdate,
  sentinelRef,
}: SlideFormEdgeProps) {
  const id = item[entityPrimaryKeyProperty];

  const getEdgeColor = useMemo(() => makeGetEdgeColor(), []);
  const edgeColor = useSelector(getEdgeColor);
  const nodes = useSelector(getNetworkNodes);

  const fromNode = find(nodes, [entityPrimaryKeyProperty, item.from]);
  const toNode = find(nodes, [entityPrimaryKeyProperty, item.to]);

  const rawAttributes = item[entityAttributesProperty];

  const initialValues: Record<string, FieldValue> | undefined = rawAttributes
    ? (Object.fromEntries(
        Object.entries(rawAttributes).map(([key, value]) => [
          key,
          value ?? undefined,
        ]),
      ) as Record<string, FieldValue>)
    : undefined;

  const subject: Subject = { entity: 'edge', type: item.type };

  const { fieldComponents } = useProtocolForm({
    fields: form.fields,
    autoFocus: false,
    initialValues,
    subject,
  });

  const handleSubmit: FormSubmitHandler = (values) => {
    onUpdate?.({
      edgeId: id,
      newAttributeData: values as Record<string, unknown>,
    });
    return { success: true as const };
  };

  return (
    <>
      <div className="phone-landscape:mt-4 tablet-landscape:mt-6 mt-2 flex shrink-0 items-center">
        {fromNode && <Node {...fromNode} className="rounded-full" />}
        <div
          className={cx(
            edgeColorMap[edgeColor],
            'mx-[-1.5rem] h-2 w-32 bg-(--edge-color)',
          )}
        />
        {toNode && <Node {...toNode} className="rounded-full" />}
      </div>
      <div className="flex min-h-0 w-full shrink flex-col">
        <ScrollArea className="h-auto">
          <Surface className="phone-landscape:mx-4 tablet-landscape:mx-6 desktop:mx-8 mx-auto max-w-2xl">
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
    </>
  );
}
