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
import Scroller from '~/lib/ui/components/Scroller';
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
    <div className="swiper-slide">
      <div className="slide-content">
        {fromNode && <Node {...fromNode} />}
        <div
          className="fake-edge"
          style={{ backgroundColor: `var(--nc-${edgeColor})` }}
        />
        {toNode && <Node {...toNode} />}
        <div className="alter-form__form-container alter-edge-form__form-container">
          <Scroller onScroll={() => onScroll?.()}>
            <Form
              fields={form.fields}
              handleSubmit={handleSubmit}
              getInitialValues={() =>
                initialValues as Record<string, unknown>
              }
              className="alter-form__form alter-edge-form__form"
              autoFocus={false}
              subject={subject}
              submitButton={submitButton}
              validationMeta={{ entityId: id.toString() }}
              otherNetworkEntities={otherNetworkEntities}
            />
          </Scroller>
        </div>
      </div>
    </div>
  );
}
