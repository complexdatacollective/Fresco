import React, { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { findIndex } from 'lodash';
import ConvexHull from './ConvexHull';
import useResizeObserver from '~/hooks/useResizeObserver';
import { entityAttributesProperty } from '@codaco/shared-consts';
import { useSelector } from 'react-redux';
import { getCategoricalOptions } from '../../selectors/network';

const getColor = (group, options) => {
  const colorIndex = findIndex(options, ['value', group]) + 1 || 1;
  const color = `cat-color-seq-${colorIndex}`;
  return color;
};

const getNodesByGroup = (nodes, categoricalVariable) => {
  const groupedList = {};

  nodes.forEach((node) => {
    const categoricalValues = node[entityAttributesProperty][categoricalVariable];

    // Filter out nodes with no value for this variable.
    if (!categoricalValues) { return; }

    categoricalValues.forEach((categoricalValue) => {
      if (groupedList[categoricalValue]) {
        groupedList[categoricalValue].nodes.push(node);
      } else {
        groupedList[categoricalValue] = { group: categoricalValue, nodes: [] };
        groupedList[categoricalValue].nodes.push(node);
      }
    });
  });

  return groupedList;
};

const ConvexHulls = ({
  nodes,
  groupVariable,
  layoutVariable,
}) => {
  const hullRef = useRef(null);
  const [state, setState] = useState({ width: 0, height: 0 });

  const nodesByGroup = useMemo(() => getNodesByGroup(nodes, groupVariable), [nodes, groupVariable]);
  const categoricalOptions = useSelector((state) => getCategoricalOptions(state, { variableId: groupVariable }));

  useResizeObserver(hullRef, (entry) => {
    setState({ width: entry.contentRect.width, height: entry.contentRect.height });
  });

  return (
    <div style={{ width: '100%', height: '100%' }} ref={hullRef}>
      {Object.values(nodesByGroup).map(({ group, nodes }, index) => {
        const color = getColor(group, categoricalOptions);
        return (
          <ConvexHull
            windowDimensions={state}
            color={color}
            nodePoints={nodes}
            key={index}
            layoutVariable={layoutVariable}
          />
        );
      })}
    </div>
  );
};


ConvexHulls.propTypes = {
  layoutVariable: PropTypes.string.isRequired,
  nodesByGroup: PropTypes.object.isRequired,
  categoricalOptions: PropTypes.array,
};

export default ConvexHulls;
