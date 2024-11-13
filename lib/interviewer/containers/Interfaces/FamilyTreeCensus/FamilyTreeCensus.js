import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Family Tree Interface
 */
const FamilyTreeCensus = (props) => {
  console.log(props)
  return (
    <div className="family-tree-census">
      Family Tree Container
    </div>
  );
};

FamilyTreeCensus.propTypes = {
  stage: PropTypes.object.isRequired,
};

export default FamilyTreeCensus;
