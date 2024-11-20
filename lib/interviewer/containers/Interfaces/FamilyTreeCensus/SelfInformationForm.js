import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SelfInformationForm = ({ onSave }) => {
  const [formData, setFormData] = useState({
    name: 'Self',
    relation: 'Self',
    sex: '',
    dateOfBirth: '',
    twinStatus: 'No',
    adopted: false,
    health: '',
    race: [],
    ethnicity: [],
  });

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
    onSave(formData);
  };

  return (
    <form className="self-information-form" onSubmit={handleSubmit} style={{ padding: '20px', textAlign: 'left' }}>
      <h3>Enter Your Information</h3>
      <div>
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

      <div>
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

      <div>
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

      <div>
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

      <div>
        <label htmlFor="health">Health:</label>
        <input
          type="text"
          id="health"
          name="health"
          value={formData.health}
          onChange={handleInputChange}
        />
      </div>

      <div>
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

      <div>
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

      <button type="submit" style={{ marginTop: '20px', padding: '10px 20px' }}>Save Your Information</button>
    </form>
  );
};

SelfInformationForm.propTypes = {
  onSave: PropTypes.func.isRequired,
};

export default SelfInformationForm;
