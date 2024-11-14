// AddMemberForm.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AddMemberForm = ({ onAdd, onCancel }) => {
  const [formValues, setFormValues] = useState({
    name: '',
    relation: '',
  });

  const relationOptions = [
    'Brother',
    'Sister',
    'Son',
    'Daughter',
    'Mother’s Brother (Uncle)',
    'Mother’s Sister (Aunt)',
    'Father’s Brother (Uncle)',
    'Father’s Sister (Aunt)',
    'Cousin',
    'Niece',
    'Nephew',
    'Grandchild',
    // Add more options as needed
  ];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onAdd(formValues);
  };

  return (
    <div className="add-member-form">
      <h2>Add Family Member</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formValues.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="relation">Relation</label>
          <select
            id="relation"
            name="relation"
            value={formValues.relation}
            onChange={handleInputChange}
            required
          >
            <option value="" disabled>Select a relation</option>
            {relationOptions.map((relation) => (
              <option key={relation} value={relation}>
                {relation}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Add</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
};

AddMemberForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AddMemberForm;
