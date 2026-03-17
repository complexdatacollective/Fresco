import { connect } from 'react-redux';
import { updateNode } from '~/lib/interviewer/ducks/modules/session';
import { makeNetworkNodesForType } from '~/lib/interviewer/selectors/session';
import SlideFormNode from '../SlidesForm/SlideFormNode';
import SlidesForm from '../SlidesForm/SlidesForm';

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
