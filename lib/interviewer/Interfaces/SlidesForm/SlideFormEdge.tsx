import { type Form as TForm } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
} from '@codaco/shared-consts';
import { find } from 'es-toolkit/compat';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';
import Scroller from '~/lib/legacy-ui/components/Scroller';
import Node from '../../components/Node';
import { getEdgeColor, getNetworkNodes } from '../../selectors/session';

type SlideFormEdgeProps = {
  form: TForm;
  id: number;
  item: NcEdge;
  submitButton?: React.ReactNode;
  onUpdate: (args: {
    edgeId: number;
    newAttributeData: Record<string, unknown>;
  }) => void;
  otherNetworkEntities?: (NcNode | NcEdge | NcEgo)[];
  onScroll?: () => void;
};

export default function SlideFormEdge(props: SlideFormEdgeProps) {
  const {
    form,
    id,
    item,
    submitButton,
    onUpdate,
    otherNetworkEntities,
    onScroll,
  } = props;

  const edgeColor = useSelector(getEdgeColor);
  const nodes = useSelector(getNetworkNodes);

  const fromNode = find(nodes, [entityPrimaryKeyProperty, item.from]);
  const toNode = find(nodes, [entityPrimaryKeyProperty, item.to]);

  const handleSubmit = (values: unknown) => {
    const formData = values as { value: Record<string, unknown> };
    onUpdate?.({ edgeId: id, newAttributeData: formData.value });
  };

  const initialValues = item[entityAttributesProperty];

  const subject = { entity: 'edge' as const, type: item.type };

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
        {fromNode && (
          <Node
            {...fromNode}
            className="absolute top-[calc(var(--base-node-size)*-0.5)] left-[calc(-8rem+50%-var(--base-node-size)/2)] rounded-full bg-[--nc-panel-bg-muted] [&>*]:z-[2]"
          />
        )}
        <div
          className="absolute top-[-1rem] left-[calc(50%-5rem)] z-[1] h-2 w-[10rem]"
          style={{ backgroundColor: `var(--nc-${edgeColor})` }}
        />
        {toNode && (
          <Node
            {...toNode}
            className="absolute top-[calc(var(--base-node-size)*-0.5)] left-[calc(8rem+50%-var(--base-node-size)/2)] rounded-full bg-[--nc-panel-bg-muted]"
          />
        )}
        <div className="mt-[calc(var(--base-node-size)*0.4)] h-full w-full">
          <Scroller onScroll={() => onScroll?.()}>
            <Form
              {...({
                fields: form.fields,
                handleSubmit,
                getInitialValues: () =>
                  initialValues as Record<string, unknown>,
                className: '[&_.form-field-container]:break-inside-avoid',
                autoFocus: false,
                subject,
                submitButton,
                validationMeta: { entityId: id.toString() },
                otherNetworkEntities,
              } as unknown as React.ComponentProps<typeof Form>)}
            />
          </Scroller>
        </div>
      </div>
    </div>
  );
}
