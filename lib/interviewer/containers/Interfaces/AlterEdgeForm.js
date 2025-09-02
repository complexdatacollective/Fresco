import { connect } from 'react-redux';
import { compose } from 'recompose';
import { updateEdge } from '../../ducks/modules/session';
import { getNetworkEdgesForType } from '../../selectors/session';
import SlideFormEdge from '../SlidesForm/SlideFormEdge';
import SlidesForm from '../SlidesForm/SlidesForm';

const AlterEdgeForm = (props) => (
  <SlidesForm
    itemName="edge"
    slideForm={SlideFormEdge}
    parentClass="alter-edge-form"
    updateItem={props.updateItem}
    items={props.items}
    stage={props.stage}
    registerBeforeNext={props.registerBeforeNext}
    getNavigationHelpers={props.getNavigationHelpers}
  />
);

const mapStateToProps = (state) => ({
  items: getNetworkEdgesForType(state),
});

const mapDispatchToProps = {
  updateItem: updateEdge,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(
  AlterEdgeForm,
);
