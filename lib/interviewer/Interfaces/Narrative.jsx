import { entityAttributesProperty } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import ConvexHulls from '~/lib/interviewer/components/Canvas/ConvexHulls';
import NodeLayout from '~/lib/interviewer/containers/Canvas/NodeLayout';
import Canvas from '../components/Canvas/Canvas';
import NarrativeEdgeLayout from '../components/Canvas/NarrativeEdgeLayout';
import { LayoutProvider } from '../contexts/LayoutContext';
import { edgesToCoords } from '../selectors/canvas';
import { getNetworkEdges, getNetworkNodes } from '../selectors/session';
import Annotations from '../containers/Canvas/Annotations';
import Background from '../containers/Canvas/Background';
import PresetSwitcher from '../containers/Canvas/PresetSwitcher';

/**
 * Narrative Interface
 * @extends Component
 */
class Narrative extends Component {
  constructor(props) {
    super(props);
    this.state = {
      presetIndex: 0,
      showConvexHulls: true,
      showEdges: true,
      showHighlightedNodes: true,
      highlightIndex: 0,
      activeAnnotations: false,
      activeFocusNodes: false,
      isFrozen: false,
    };

    this.annotationLayer = React.createRef();
  }

  handleChangeActiveAnnotations = (status) => {
    this.setState({
      activeAnnotations: status,
    });
  };

  handleToggleHulls = () => {
    this.setState((oldState) => ({
      showConvexHulls: !oldState.showConvexHulls,
    }));
  };

  handleToggleEdges = () => {
    this.setState((oldState) => ({
      showEdges: !oldState.showEdges,
    }));
  };

  handleToggleHighlighting = () => {
    this.setState((oldState) => ({
      showHighlightedNodes: !oldState.showHighlightedNodes,
    }));
  };

  handleChangeHighlightIndex = (index) => {
    this.setState({
      highlightIndex: index,
    });
  };

  handleToggleFreeze = () => {
    this.setState((oldState) => ({
      isFrozen: !oldState.isFrozen,
    }));
  };

  handleResetInteractions = () => {
    this.annotationLayer.current.reset();
  };

  handleChangePreset = (index) => {
    const { presetIndex } = this.state;

    if (index !== presetIndex) {
      this.setState({
        showConvexHulls: true,
        showEdges: true,
        showHighlightedNodes: true,
        highlightIndex: 0,
        presetIndex: index,
        activeAnnotations: false,
        activeFocusNodes: false,
      });
    }
  };

  render() {
    const { stage, nodes, edges } = this.props;

    const {
      presetIndex,
      activeAnnotations,
      activeFocusNodes,
      showEdges,
      showConvexHulls,
      isFrozen,
      showHighlightedNodes,
      highlightIndex,
    } = this.state;

    const { presets } = stage;

    const currentPreset = presets[presetIndex];

    // Behaviour Configuration
    const allowRepositioning = get(
      stage,
      'behaviours.allowRepositioning',
      false,
    );
    const freeDraw = get(stage, 'behaviours.freeDraw', false);
    const shouldShowResetButton = activeAnnotations || activeFocusNodes;

    // Display Properties
    const layoutVariable = get(currentPreset, 'layoutVariable');
    const displayEdges = showEdges
      ? get(currentPreset, 'edges.display', [])
      : [];
    const highlight = get(currentPreset, 'highlight', []);
    const convexHullVariable = showConvexHulls
      ? get(currentPreset, 'groupVariable', '')
      : '';

    // Background Configuration
    const backgroundImage = get(stage, 'background.image');
    const concentricCircles = get(stage, 'background.concentricCircles');
    const skewedTowardCenter = get(stage, 'background.skewedTowardCenter');

    // Wrangled entities

    // NodeLayout and ConvexHulls should only be passed nodes that have
    // the layoutVariable set
    const nodesWithLayout = nodes.filter(
      (node) => node[entityAttributesProperty][layoutVariable],
    );

    // EdgeLayout should only be passed edges that are included in the presets
    // edges.display list
    const filteredEdges = edges.filter((edge) =>
      displayEdges.includes(edge.type),
    );
    const edgesWithCoords = edgesToCoords(filteredEdges, {
      nodes: nodesWithLayout,
      layout: layoutVariable,
    });

    return (
      <div className="narrative-interface">
        <div className="narrative-interface__canvas" id="sociogram-canvas">
          <LayoutProvider
            layout={layoutVariable}
            nodes={nodesWithLayout}
            edges={edgesWithCoords}
          >
            <Canvas
              className="narrative-concentric-circles"
              id="concentric-circles"
              key={`circles-${currentPreset.id}`}
            >
              <Background
                concentricCircles={concentricCircles}
                skewedTowardCenter={skewedTowardCenter}
                image={backgroundImage}
              />
              <ConvexHulls
                nodes={nodesWithLayout}
                groupVariable={convexHullVariable}
                layoutVariable={layoutVariable}
              />
              <NarrativeEdgeLayout edges={edgesWithCoords} />
              {freeDraw && (
                <Annotations
                  ref={this.annotationLayer}
                  isFrozen={isFrozen}
                  onChangeActiveAnnotations={this.handleChangeActiveAnnotations}
                />
              )}
              <NodeLayout
                nodes={nodesWithLayout}
                id="NODE_LAYOUT"
                highlightAttribute={
                  showHighlightedNodes ? highlight[highlightIndex] : null
                }
                layoutVariable={layoutVariable}
                allowPositioning={allowRepositioning}
              />
            </Canvas>
            <PresetSwitcher
              id="drop-obstacle"
              presets={presets}
              activePreset={presetIndex}
              highlightIndex={highlightIndex}
              isFrozen={isFrozen}
              shouldShowResetButton={shouldShowResetButton}
              shouldShowFreezeButton={freeDraw}
              onResetInteractions={this.handleResetInteractions}
              onChangePreset={this.handleChangePreset}
              onToggleFreeze={this.handleToggleFreeze}
              onToggleHulls={this.handleToggleHulls}
              onToggleEdges={this.handleToggleEdges}
              onChangeHighlightIndex={this.handleChangeHighlightIndex}
              onToggleHighlighting={this.handleToggleHighlighting}
            />
          </LayoutProvider>
        </div>
      </div>
    );
  }
}

Narrative.propTypes = {
  stage: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  return {
    nodes: getNetworkNodes(state),
    edges: getNetworkEdges(state),
  };
}

export default compose(connect(mapStateToProps))(Narrative);
