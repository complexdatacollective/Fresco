// EditMemberForm.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const EditMemberForm = ({ memberData, onSave, onCancel }) => {
  const [formValues, setFormValues] = useState(memberData || {
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

  useEffect(() => {
    setFormValues(memberData || {
      name: '',
      relation: '',
    });
  }, [memberData]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formValues);
  };

  return (
    <div className="edit-member-form">
      <h2>{memberData ? 'Edit Family Member' : 'Add Family Member'}</h2>
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
        {/* Add additional fields as needed */}
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
};

EditMemberForm.propTypes = {
  memberData: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default EditMemberForm;
