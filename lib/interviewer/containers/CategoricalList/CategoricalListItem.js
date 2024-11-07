import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { compose } from '@reduxjs/toolkit';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { connect } from 'react-redux';
import { getNodeColor } from '~/lib/interviewer/selectors/network';
import CategoricalItem from '../../components/CategoricalItem';
import { getEntityAttributes } from '../../ducks/modules/network';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import { getSubjectType } from '../../selectors/prop';
import { get } from '../../utils/lodash-replacements';
import Overlay from '../Overlay';
import OtherVariableForm from './OtherVariableForm';

const formatBinDetails = (nodes) => {
  if (nodes.length === 0) {
    return '';
  }

  // todo: the following should be updated to reflect the sort order of the bins
  const name = getNodeLabel(nodes[0]);

  return `${name}${nodes.length > 1 ? ` and ${nodes.length - 1} other${nodes.length > 2 ? 's' : ''}` : ''}`;
};

const otherVariableWindowInitialState = {
  show: false,
  node: null,
};

const CategoricalListItem = (props) => {
  const {
    id,
    size = 0,
    isExpanded,
    accentColor = null,
    activePromptVariable,
    promptOtherVariable = null,
    bin,
    index,
    sortOrder = [],
    nodeColor,
    onExpandBin,
    updateNode,
    stage,
  } = props;

  const isOtherVariable = !!bin.otherVariable;
  const [otherVariableWindow, setOtherVariableWindow] = useState(
    otherVariableWindowInitialState,
  );
  const binDetails = formatBinDetails(bin.nodes);

  const openOtherVariableWindow = (node) => {
    const otherVariable = get(getEntityAttributes(node), bin.otherVariable);

    setOtherVariableWindow({
      show: true,
      node,
      label: getNodeLabel(node),
      color: nodeColor,
      initialValues: {
        otherVariable,
      },
    });
  };

  const closeOtherVariableWindow = () =>
    setOtherVariableWindow(otherVariableWindowInitialState);

  const setNodeCategory = (node, category) => {
    const variable = bin.otherVariable || activePromptVariable;

    const resetVariable = bin.otherVariable
      ? activePromptVariable
      : promptOtherVariable;

    // categorical requires an array, otherVariable is a string
    const value = bin.otherVariable ? category : [category];

    if (getEntityAttributes(node)[variable] === value) {
      return;
    }

    updateNode(
      node[entityPrimaryKeyProperty],
      {},
      {
        [variable]: value,
        // reset is used to clear the variable when a node is moved to a different bin
        ...(!!resetVariable && { [resetVariable]: null }),
      },
      'drop',
    );
  };

  const handleDrop = ({ meta: node }) => {
    const binValue = bin.value;

    if (isOtherVariable) {
      openOtherVariableWindow(node);
      return;
    }

    setNodeCategory(node, binValue);
  };

  const handleClickItem = (node) => {
    if (!isOtherVariable) {
      return;
    }
    openOtherVariableWindow(node);
  };

  const handleSubmitOtherVariableForm = ({ otherVariable: value }) => {
    const { node } = otherVariableWindow;

    setNodeCategory(node, value);
    closeOtherVariableWindow();
  };

  const handleExpandBin = (e) => {
    if (e) {
      e.stopPropagation();
    }
    onExpandBin(index);
  };

  return (
    <div
      className="categorical-list__item"
      style={{ width: `${size}px`, height: `${size}px` }}
      key={index}
      onClick={handleExpandBin}
    >
      <CategoricalItem
        id={id}
        key={index}
        label={bin.label}
        accentColor={accentColor}
        onDrop={handleDrop}
        onClick={handleExpandBin}
        onClickItem={handleClickItem}
        details={binDetails}
        isExpanded={isExpanded}
        nodes={bin.nodes}
        sortOrder={sortOrder}
        stage={stage}
      />
      {isOtherVariable && (
        <Overlay
          style={{ maxWidth: '85ch' }}
          show={otherVariableWindow.show}
          onClose={closeOtherVariableWindow}
          onBlur={closeOtherVariableWindow}
        >
          {otherVariableWindow.show && (
            <OtherVariableForm
              label={otherVariableWindow.label}
              color={otherVariableWindow.color}
              otherVariablePrompt={bin.otherVariablePrompt}
              onSubmit={handleSubmitOtherVariableForm}
              onCancel={closeOtherVariableWindow}
              initialValues={otherVariableWindow.initialValues}
            />
          )}
        </Overlay>
      )}
    </div>
  );
};

CategoricalListItem.propTypes = {
  id: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  activePromptVariable: PropTypes.string.isRequired,
  promptOtherVariable: PropTypes.string,
  bin: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  sortOrder: PropTypes.array,
  onExpandBin: PropTypes.func.isRequired,
  updateNode: PropTypes.func.isRequired,
  accentColor: PropTypes.string,
  size: PropTypes.number,
};

const makeMapStateToProps = () => {
  return (state, props) => {
    const type = getSubjectType(state, props);
    const color = getNodeColor(type)(state, props);

    return {
      nodeColor: color,
    };
  };
};

const mapDispatchToProps = {
  updateNode: sessionActions.updateNode,
};

export default compose(connect(makeMapStateToProps, mapDispatchToProps))(
  CategoricalListItem,
);
