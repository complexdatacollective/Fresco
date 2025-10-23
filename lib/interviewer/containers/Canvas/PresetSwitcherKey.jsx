import cx from 'classnames';
import { get, isEmpty } from 'es-toolkit/compat';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { createPortal } from 'react-dom';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import { RadioGroupField } from '~/lib/form/components/fields/RadioGroup';
import Icon from '~/lib/ui/components/Icon';
import {
  getCurrentStage,
  makeGetCategoricalOptions,
  makeGetEdgeColor,
  makeGetEdgeLabel,
  makeGetNodeAttributeLabel,
} from '../../selectors/session';
import Accordion from './Accordion';

class PresetSwitcherKey extends Component {
  constructor() {
    super();
    this.state = {
      isOpen: false,
    };

    this.panel = React.createRef();
  }

  togglePanel = () => {
    this.setState((oldState) => ({
      isOpen: !oldState.isOpen,
    }));
  };

  renderHighlightLabel = (highlight, index) => {
    const { highlightIndex, changeHighlightIndex } = this.props;

    const handleHighlightClick = (event) => {
      event.stopPropagation();
      changeHighlightIndex(index);
    };

    return (
      <RadioGroupField
        className="accordion-item"
        key={index}
        input={{
          value: index,
          checked: index === highlightIndex,
          onChange: (event) => handleHighlightClick(event, index),
        }}
        label={highlight}
      />
    );
  };

  render() {
    const {
      toggleHighlighting,
      toggleEdges,
      toggleHulls,
      isOpen,
      convexOptions,
      edges,
      highlightLabels,
    } = this.props;

    const classNames = cx('preset-switcher-key', {
      'preset-switcher-key--open': isOpen,
    });

    return createPortal(
      <div className={classNames} ref={this.panel}>
        <div className="preset-switcher-key__content">
          {!isEmpty(highlightLabels) && (
            <Accordion
              label="Attributes"
              onAccordionToggle={toggleHighlighting}
            >
              {highlightLabels.map(this.renderHighlightLabel)}
            </Accordion>
          )}
          {!isEmpty(edges) && (
            <Accordion label="Links" onAccordionToggle={toggleEdges}>
              {edges.map((edge, index) => (
                <div className="accordion-item" key={index}>
                  <Icon name="links" color={edge.color} />
                  {edge.label}
                </div>
              ))}
            </Accordion>
          )}
          {!isEmpty(convexOptions) && (
            <Accordion label="Groups" onAccordionToggle={toggleHulls}>
              {convexOptions.map((option, index) => (
                <div className="accordion-item" key={index}>
                  <Icon
                    name="contexts"
                    color={`nc-cat-color-seq-${index + 1}`}
                  />
                  <RenderMarkdown>{option.label}</RenderMarkdown>
                </div>
              ))}
            </Accordion>
          )}
        </div>
      </div>,
      document.body,
    );
  }
}

PresetSwitcherKey.propTypes = {
  preset: PropTypes.object.isRequired,
  highlightIndex: PropTypes.number.isRequired,
  changeHighlightIndex: PropTypes.func.isRequired,
  toggleHighlighting: PropTypes.func.isRequired,
  toggleEdges: PropTypes.func.isRequired,
  toggleHulls: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

const makeMapStateToProps = () => {
  const getEdgeColor = makeGetEdgeColor();
  const getEdgeLabel = makeGetEdgeLabel();
  const getNodeAttributeLabel = makeGetNodeAttributeLabel();
  const getCategoricalOptions = makeGetCategoricalOptions();

  const mapStateToProps = (state, props) => {
    const stage = getCurrentStage(state);
    const highlightLabels = get(props, 'preset.highlight', []).map((variable) =>
      getNodeAttributeLabel(state, {
        stage,
        variableId: variable,
        ...props,
      }),
    );
    const edges = get(props, 'preset.edges.display', []).map((type) => ({
      label: getEdgeLabel(state, { type }),
      color: getEdgeColor(state, { type }),
    }));
    const convexOptions = getCategoricalOptions(state, {
      stage: getCurrentStage(state),
      variableId: props.preset.groupVariable,
      ...props,
    });

    return {
      convexOptions,
      edges,
      highlightLabels,
    };
  };

  return mapStateToProps;
};

export default compose(connect(makeMapStateToProps))(PresetSwitcherKey);
