import { type Form as TForm } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
} from '@codaco/shared-consts';
import { find } from 'es-toolkit/compat';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { type FieldValue } from '~/lib/form/components/Field/types';
import Form from '~/lib/form/components/Form';
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
  otherNetworkEntities?: (NcNode | NcEdge | NcEgo)[];
  onScroll?: () => void;
};

export default function SlideFormEdge(props: SlideFormEdgeProps) {
  const { form, item, submitButton, onUpdate } = props;
  const id = item[entityPrimaryKeyProperty];

  const getEdgeColor = useMemo(() => makeGetEdgeColor(), []);
  const edgeColor = useSelector(getEdgeColor);
  const nodes = useSelector(getNetworkNodes);

  const fromNode = find(nodes, [entityPrimaryKeyProperty, item.from]);
  const toNode = find(nodes, [entityPrimaryKeyProperty, item.to]);

  const rawAttributes = item[entityAttributesProperty];

  // Convert null values to undefined for form compatibility
  const initialValues: Record<string, FieldValue> | undefined = rawAttributes
    ? (Object.fromEntries(
        Object.entries(rawAttributes).map(([key, value]) => [
          key,
          value ?? undefined,
        ]),
      ) as Record<string, FieldValue>)
    : undefined;

  // Derive subject from the edge item
  const subject: Subject = { entity: 'edge', type: item.type };

  // Convert protocol form fields to React components
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
        {/* Node pair with edge - uses flex layout like DyadCensus */}
        <div className="absolute top-[calc(var(--base-node-size)*-0.5)] left-1/2 flex -translate-x-1/2 items-center">
          {fromNode && (
            <Node
              {...fromNode}
              className="rounded-full bg-(--nc-panel-bg-muted)"
            />
          )}
          <div
            className={cx(
              edgeColorMap[edgeColor],
              'mx-[-1.5rem] h-2 w-32 bg-(--edge-color)',
            )}
          />
          {toNode && (
            <Node
              {...toNode}
              className="rounded-full bg-(--nc-panel-bg-muted)"
            />
          )}
        </div>
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
