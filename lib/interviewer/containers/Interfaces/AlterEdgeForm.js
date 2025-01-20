import { connect } from 'react-redux';
import { updateEdge } from '../../ducks/modules/session';
import { makeNetworkEdgesForType } from '../../selectors/session';
import SlideFormEdge from '../SlidesForm/SlideFormEdge';
import SlidesForm from '../SlidesForm/SlidesForm';

const AlterEdgeForm = (props) => (
  <SlidesForm
    itemName="edge"
    slideForm={SlideFormEdge}
    parentClass="alter-edge-form"
    {...props}
  />
);

function makeMapStateToProps() {
  const getStageEdges = makeNetworkEdgesForType();

  const mapStateToProps = (state, props) => ({
    items: getStageEdges(state, props),
  });

  return mapStateToProps;
}

const mapDispatchToProps = {
  updateItem: updateEdge,
};

const withAlterStore = connect(makeMapStateToProps, mapDispatchToProps);

export default withAlterStore(AlterEdgeForm);
