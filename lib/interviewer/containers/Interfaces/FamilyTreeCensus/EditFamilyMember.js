// EditFamilyMember.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const EditFamilyMember = ({ member, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    sex: '',
    dateOfBirth: '',
    twinStatus: 'No',
    adopted: false,
    health: '',
    race: [],
    ethnicity: [],
  });

  useEffect(() => {
    if (member) {
      setFormData(member);
    }
  }, [member]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);

    setFormData((prevData) => ({
      ...prevData,
      [name]: selectedValues,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: member.id });
  };

  return (
    <div className="edit-family-member-form">
      <form onSubmit={handleSubmit}>
        <h2>Edit Family Member</h2>
        <div className="form-field">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="relation">Relation:</label>
          <input
            type="text"
            id="relation"
            name="relation"
            value={formData.relation}
            onChange={handleInputChange}
            disabled
          />
        </div>
        <div className="form-field">
          <label htmlFor="sex">Sex:</label>
          <select
            id="sex"
            name="sex"
            value={formData.sex}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="dateOfBirth">Date of Birth:</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-field">
          <label>Were you born a twin?</label>
          <div>
            <label>
              <input
                type="radio"
                name="twinStatus"
                value="No"
                checked={formData.twinStatus === 'No'}
                onChange={handleInputChange}
              />
              No
            </label>
            <label>
              <input
                type="radio"
                name="twinStatus"
                value="Identical"
                checked={formData.twinStatus === 'Identical'}
                onChange={handleInputChange}
              />
              Yes - Identical
            </label>
            <label>
              <input
                type="radio"
                name="twinStatus"
                value="Fraternal"
                checked={formData.twinStatus === 'Fraternal'}
                onChange={handleInputChange}
              />
              Yes - Fraternal
            </label>
          </div>
        </div>
        <div className="form-field">
          <label>
            <input
              type="checkbox"
              name="adopted"
              checked={formData.adopted}
              onChange={handleInputChange}
            />
            Adopted
          </label>
        </div>
        <div className="form-field">
          <label htmlFor="health">Health:</label>
          <input
            type="text"
            id="health"
            name="health"
            value={formData.health}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="race">Race:</label>
          <select
            id="race"
            name="race"
            multiple
            value={formData.race}
            onChange={handleMultiSelectChange}
          >
            <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
            <option value="Asian">Asian</option>
            <option value="Black or African-American">Black or African-American</option>
            <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
            <option value="White">White</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="ethnicity">Ethnicity:</label>
          <select
            id="ethnicity"
            name="ethnicity"
            multiple
            value={formData.ethnicity}
            onChange={handleMultiSelectChange}
          >
            <option value="Hispanic or Latino">Hispanic or Latino</option>
            <option value="Ashkenazi Jewish">Ashkenazi Jewish</option>
            <option value="Not Hispanic or Latino">Not Hispanic or Latino</option>
          </select>
        </div>
        <button type="submit">Save Changes</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
};

EditFamilyMember.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    relation: PropTypes.string.isRequired,
    sex: PropTypes.string.isRequired,
    dateOfBirth: PropTypes.string.isRequired,
    twinStatus: PropTypes.string.isRequired,
    adopted: PropTypes.bool.isRequired,
    health: PropTypes.string,
    race: PropTypes.arrayOf(PropTypes.string).isRequired,
    ethnicity: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default EditFamilyMember;
