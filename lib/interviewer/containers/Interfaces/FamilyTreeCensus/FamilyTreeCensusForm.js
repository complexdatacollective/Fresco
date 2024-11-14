// FamilyTreeCensusForm.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const FamilyTreeCensusForm = ({ stage }) => {
  const questions = [
    { label: "How many brothers do you have?", name: "brothers" },
    { label: "How many sisters do you have?", name: "sisters" },
    { label: "How many sons do you have?", name: "sons" },
    { label: "How many daughters do you have?", name: "daughters" },
    { label: "How many brothers does your mother have? (your uncles)", name: "mothersBrothers" },
    { label: "How many sisters does your mother have? (your aunts)", name: "mothersSisters" },
    { label: "How many brothers does your father have? (your uncles)", name: "fathersBrothers" },
    { label: "How many sisters does your father have? (your aunts)", name: "fathersSisters" },
  ];

  const [formValues, setFormValues] = useState(
    questions.reduce((acc, question) => ({ ...acc, [question.name]: 0 }), {})
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const parsedValue = value === '' ? 0 : parseInt(value) || 0;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: parsedValue,
    }));
  };

  return (
    <div className="family-tree-census__form">
      <h1>Now we will build your family.</h1>
      <ul>
        <li>We automatically add your parents and grandparents for you.</li>
        <li>Tell us about your immediate family, including your brothers, sisters, children, aunts, and uncles.</li>
        <li>You can add more family members like cousins, nieces, nephews, half siblings, and grandchildren later.</li>
        <li>We collect information only for blood relatives, not household members, step-relatives, or spouses (unless related by blood).</li>
      </ul>
      {questions.map(({ label, name }) => (
        <div key={name} className="question-row">
          <label htmlFor={name}>{label}</label>
          <input
            type="number"
            id={name}
            name={name}
            value={formValues[name]}
            onChange={handleInputChange}
            min="0"
          />
        </div>
      ))}
    </div>
  );
};

FamilyTreeCensusForm.propTypes = {
  stage: PropTypes.object.isRequired,
};

export default FamilyTreeCensusForm;
