import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { clamp, noop } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getTwoModeLayoutVariable } from '../components/Canvas/utils';
import { updateNode } from '../ducks/modules/session';
import useForceSimulation from '../hooks/useForceSimulation';

const SIMULATION_OPTIONS = {
  decay: 0.1,
  charge: -30,
  linkDistance: 20,
  center: 0.1,
};

const LayoutContext = React.createContext({
  network: {
    nodes: [],
    edges: [],
    layout: undefined,
    links: [],
  },
  getPosition: noop,
  allowAutomaticLayout: false,
  simulation: undefined,
});

const getLinks = ({ nodes, edges }) => {
  if (nodes.length === 0 || edges.length === 0) {
    return [];
  }

  const nodeIdMap = nodes.reduce((memo, node, index) => {
    const uid = node[entityPrimaryKeyProperty];
    return {
      ...memo,
      [uid]: index,
    };
  }, {});

  const links = edges.reduce((acc, { from, to }) => {
    const source = nodeIdMap[from];
    const target = nodeIdMap[to];
    if (source === undefined || target === undefined) {
      return acc;
    }
    return [...acc, { source, target }];
  }, []);

  return links;
};

export const LayoutProvider = ({
  children,
  nodes,
  edges,
  layout,
  twoMode,
  allowAutomaticLayout,
  onLayoutComplete = noop,
}) => {
  const dispatch = useDispatch();

  const updateNetworkInStore = useCallback(() => {
    if (!forceSimulation.current) {
      return;
    }

    nodes.forEach((node, index) => {
      const position = get(forceSimulation.current.nodes, [index]);
      if (!position) {
        return;
      }
      const { x, y } = position;

      const layoutVariable = twoMode ? layout[node.type] : layout;

      dispatch(
        updateNode({
          nodeId: node[entityPrimaryKeyProperty],
          newAttributeData: {
            [layoutVariable]: { x: clamp(x, 0, 1), y: clamp(y, 0, 1) },
          },
        }),
      );
    });

    onLayoutComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, nodes, layout, onLayoutComplete]);

  const {
    state: forceSimulation,
    screen,
    isRunning,
    start,
    reheat,
    stop,
    initialize,
    updateOptions,
    moveNode,
    releaseNode,
    updateNetwork,
  } = useForceSimulation(updateNetworkInStore);

  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [links, setLinks] = useState([]);

  const previousIsRunning = useRef(false);
  const getPosition = useRef(() => undefined);

  // TODO: this seems like a misguided approach, mixing "reactive"
  // and "constant" values. Any other ideas?
  useEffect(() => {
    getPosition.current = (index) => {
      if (allowAutomaticLayout && simulationEnabled) {
        return get(forceSimulation.current.nodes, [index]);
      }

      const nodeType = get(nodes, [index, 'type']);
      const layoutVariable = getTwoModeLayoutVariable(
        twoMode,
        nodeType,
        layout,
      );
      return get(nodes, [index, 'attributes', layoutVariable]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, simulationEnabled, allowAutomaticLayout, layout, twoMode]);

  useEffect(() => {
    const didStopRunning =
      isRunning.current &&
      isRunning.current == false &&
      previousIsRunning.current == true;
    previousIsRunning.current = isRunning.current;

    if (didStopRunning) {
      updateNetworkInStore();
    }
  }, [isRunning, updateNetworkInStore]);

  const toggleSimulation = useCallback(() => {
    if (!simulationEnabled) {
      setSimulationEnabled(true);
      reheat();
      return;
    }

    stop();
    // Run setSimulationEnabled in next tick in order to
    // allow updateNetworkInStore to run before getPosition
    // changes to redux state.
    setTimeout(() => {
      setSimulationEnabled(false);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationEnabled, setSimulationEnabled, updateNetworkInStore]);

  useEffect(() => {
    const nextLinks = getLinks({ nodes, edges });
    setLinks(nextLinks);
  }, [edges, nodes]);

  useEffect(() => {
    if (!allowAutomaticLayout) {
      return;
    }

    // We can start with an empty network since the other effects
    // will provide the nodes/links
    const network = {};
    initialize(network, SIMULATION_OPTIONS);
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowAutomaticLayout]);

  useEffect(() => {
    if (!allowAutomaticLayout || !simulationEnabled) {
      return;
    }

    const simulationNodes = nodes.map(({ attributes, type }) => {
      const layoutVariable = twoMode ? layout[type] : layout;
      return get(attributes, layoutVariable);
    });

    updateNetwork({ nodes: simulationNodes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowAutomaticLayout, simulationEnabled, nodes, layout, twoMode]);

  useEffect(() => {
    if (!allowAutomaticLayout || !simulationEnabled) {
      return;
    }

    updateNetwork({ links });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowAutomaticLayout, simulationEnabled, links]);

  const simulation = allowAutomaticLayout
    ? {
        simulation: forceSimulation,
        initialize,
        updateOptions,
        start,
        reheat,
        stop,
        moveNode,
        releaseNode,
        simulationEnabled,
        toggleSimulation,
      }
    : undefined;

  const value = {
    network: {
      nodes,
      edges,
      layout,
      links,
    },
    screen,
    allowAutomaticLayout,
    twoMode,
    getPosition,
    simulation,
  };

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
};

export default LayoutContext;
