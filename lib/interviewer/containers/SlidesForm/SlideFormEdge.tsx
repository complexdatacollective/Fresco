import { type Form } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
} from '@codaco/shared-consts';
import { find } from 'es-toolkit/compat';
import { useSelector } from 'react-redux';
import Scroller from '~/lib/ui/components/Scroller';
import Node from '../../components/Node';
import { getEdgeColor, getNetworkNodes } from '../../selectors/session';

type SlideFormEdgeProps = {
  form: Form;
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

export function SlideFormEdge(props: SlideFormEdgeProps) {
  const edgeColor = useSelector(getEdgeColor);
  const nodes = useSelector(getNetworkNodes);

  const fromNode = find(nodes, [entityPrimaryKeyProperty, props.item.from]);
  const toNode = find(nodes, [entityPrimaryKeyProperty, props.item.to]);

  const handleSubmit = (formData) => {
    const { id, onUpdate } = props;
    onUpdate?.({ edgeId: id, newAttributeData: formData });
  };

  const initialValues = item[entityAttributesProperty];

  return (
    <div className="swiper-slide">
      <div className="slide-content">
        <Node {...fromNode} />
        <div
          className="fake-edge"
          style={{ backgroundColor: `var(--nc-${edgeColor})` }}
        />
        <Node {...toNode} />
        <div className="alter-form__form-container alter-edge-form__form-container">
          <Scroller onScroll={() => onScroll?.()}>
            <Form
              {...form}
              className="alter-form__form alter-edge-form__form"
              initialValues={initialValues}
              autoFocus={false}
              subject={subject}
              onSubmit={handleSubmit}
              submitButton={submitButton}
              validationMeta={{ entityId: id }}
              otherNetworkEntities={otherNetworkEntities}
            />
          </Scroller>
        </div>
      </div>
    </div>
  );
}

export default SlideFormEdge;
