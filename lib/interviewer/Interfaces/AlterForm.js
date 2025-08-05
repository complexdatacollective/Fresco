import { connect } from 'react-redux';
import { updateNode } from '../ducks/modules/session';
import { makeNetworkNodesForType } from '../selectors/session';
import SlideFormNode from '../containers/SlidesForm/SlideFormNode';
import SlidesForm from '../containers/SlidesForm/SlidesForm';

const AlterForm = (props) => (
  <SlidesForm itemName="alter" slideForm={SlideFormNode} {...props} />
);

function makeMapStateToProps() {
  const getStageNodes = makeNetworkNodesForType();

  const mapStateToProps = (state, props) => ({
    items: getStageNodes(state, props),
  });

  return mapStateToProps;
}

const mapDispatchToProps = {
  updateItem: updateNode,
};

const withAlterStore = connect(makeMapStateToProps, mapDispatchToProps);

export default withAlterStore(AlterForm);
