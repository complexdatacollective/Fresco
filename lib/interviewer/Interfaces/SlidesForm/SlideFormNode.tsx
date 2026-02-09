import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
  type NcEdge,
  type NcEgo,
} from '@codaco/shared-consts';
import type { Form as TForm } from '@codaco/protocol-validation';
import Form from '~/lib/form/components/Form';
import Scroller from '~/lib/legacy-ui/components/Scroller';
import Node from '../../components/Node';

type SlideFormNodeProps = {
  form: TForm;
  subject: Record<string, unknown>;
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
  subject,
  submitButton = (
    <button type="submit" key="submit" aria-label="Submit" hidden />
  ),
  onUpdate,
  otherNetworkEntities,
  onScroll,
}: SlideFormNodeProps) {
  const id = item[entityPrimaryKeyProperty];
  const initialValues = item[entityAttributesProperty];

  const handleSubmit = (formData: Record<string, unknown>) => {
    onUpdate?.({ nodeId: id, newAttributeData: formData });
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
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
        <div className="mt-[calc(var(--base-node-size)*0.4)] h-full w-full">
          <Scroller onScroll={onScroll?.()}>
            <Form
              {...({
                ...form,
                className: '[&_.form-field-container]:break-inside-avoid',
                initialValues: initialValues as Record<string, unknown>,
                autoFocus: false,
                subject,
                onSubmit: handleSubmit,
                submitButton,
                validationMeta: { entityId: id },
                otherNetworkEntities,
              } as unknown as React.ComponentProps<typeof Form>)}
            />
          </Scroller>
        </div>
      </div>
    </div>
  );
}
