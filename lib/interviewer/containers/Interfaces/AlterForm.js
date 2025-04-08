import React from 'react';
import { connect } from 'react-redux';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import { makeNetworkNodesForType } from '../../selectors/interface';
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
  updateItem: sessionActions.updateNode,
};

const withAlterStore = connect(makeMapStateToProps, mapDispatchToProps);

export default withAlterStore(AlterForm);
