// FamilyBuildForm.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const FamilyBuildForm = ({ onSave }) => {
  const [familyData, setFamilyData] = useState({
    brothers: 0,
    sisters: 0,
    sons: 0,
    daughters: 0,
    unclesFromMother: 0,
    auntsFromMother: 0,
    unclesFromFather: 0,
    auntsFromFather: 0,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFamilyData((prevData) => ({
      ...prevData,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedFamilyData = Object.entries(familyData).map(([key, value]) => ({
      relation: key,
      count: value,
    }));
    onSave(formattedFamilyData);
  };

  return (
    <div className="family-build-form">
      <form onSubmit={handleSubmit}>
        <h2>Now we will build your family.</h2>
        <p>We automatically add your parents and grandparents for you.</p>
        <p>Tell us about your immediate family, including your brothers, sisters, children, aunts, and uncles.</p>
        <p>You can add more family members like cousins, nieces, nephews, half siblings, and grandchildren later.</p>
        <p>We collect information only for blood relatives, not household members, not step-relatives, nor spouses (unless related by blood).</p>
        <div className="form-field">
          <label htmlFor="brothers">How many brothers do you have?</label>
          <input
            type="number"
            id="brothers"
            name="brothers"
            value={familyData.brothers}
            onChange={handleInputChange}
            min="0"
            style={{ color: 'black' }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="sisters">How many sisters do you have?</label>
          <input
            type="number"
            id="sisters"
            name="sisters"
            value={familyData.sisters}
            onChange={handleInputChange}
            min="0"
            style={{ color: 'black' }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="sons">How many sons do you have?</label>
          <input
            type="number"
            id="sons"
            name="sons"
            value={familyData.sons}
            onChange={handleInputChange}
            min="0"
            style={{ color: 'black' }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="daughters">How many daughters do you have?</label>
          <input
            type="number"
            id="daughters"
            name="daughters"
            value={familyData.daughters}
            onChange={handleInputChange}
            min="0"
            style={{ color: 'black' }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="unclesFromMother">How many brothers does your mother have? (your uncles)</label>
          <input
            type="number"
            id="unclesFromMother"
            name="unclesFromMother"
            value={familyData.unclesFromMother}
            onChange={handleInputChange}
            min="0"
            style={{ color: 'black' }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="auntsFromMother">How many sisters does your mother have? (your aunts)</label>
          <input
            type="number"
            id="auntsFromMother"
            name="auntsFromMother"
            value={familyData.auntsFromMother}
            onChange={handleInputChange}
            min="0"
            style={{ color: 'black' }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="unclesFromFather">How many brothers does your father have? (your uncles)</label>
          <input
            type="number"
            id="unclesFromFather"
            name="unclesFromFather"
            value={familyData.unclesFromFather}
            onChange={handleInputChange}
            min="0"
            style={{ color: 'black' }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="auntsFromFather">How many sisters does your father have? (your aunts)</label>
          <input
            type="number"
            id="auntsFromFather"
            name="auntsFromFather"
            value={familyData.auntsFromFather}
            onChange={handleInputChange}
            min="0"
            style={{ color: 'black' }}
          />
        </div>
        <button type="submit">Build Family</button>
      </form>
    </div>
  );
};

FamilyBuildForm.propTypes = {
  onSave: PropTypes.func.isRequired,
};

export default FamilyBuildForm;
