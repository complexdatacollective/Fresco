import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';
import ConcaveMan from 'concaveman';
import { entityAttributesProperty } from '@codaco/shared-consts';

const ConvexHull = ({
  color = 'cat-color-seq-1',
  nodePoints,
  layoutVariable,
  windowDimensions,
}) => {
  const [hullPoints, setHullPoints] = useState('');

  useEffect(() => {
    const generateHull = (nodeCollection) => {
      // Restructure as array of arrays of coords
      const groupAsCoords = map(nodeCollection, (node) => {
        const nodeCoords = node[entityAttributesProperty][layoutVariable];
        return [nodeCoords.x, nodeCoords.y];
      });

      let hullPointsAsSVG = '';

      // See: https://github.com/mapbox/concaveman
      ConcaveMan(groupAsCoords, 0.6, 0).forEach((item) => {
        // Scale each hull point from ratio to window coordinate.
        const itemX = item[0] * windowDimensions.width;
        const itemY = item[1] * windowDimensions.height;

        // SVG points structured as string: "value1,value2 value3,value4"
        hullPointsAsSVG += `${itemX},${itemY} `;
      });

      return hullPointsAsSVG;
    };

    setHullPoints(generateHull(nodePoints));
  }, [nodePoints, layoutVariable, windowDimensions]);

  const hullClasses = `convex-hull convex-hull__${color}`;

  return (
    <svg className={hullClasses} xmlns="http://www.w3.org/2000/svg">
      <polygon points={hullPoints} />
    </svg>
  );
};

ConvexHull.propTypes = {
  color: PropTypes.string,
  nodePoints: PropTypes.array.isRequired,
  layoutVariable: PropTypes.string.isRequired,
  windowDimensions: PropTypes.object.isRequired,
};

export default ConvexHull;
