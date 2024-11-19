// FamilyMemberTable.js
import React from 'react';
import PropTypes from 'prop-types';

const FamilyMemberTable = ({ familyMembers = [], onEdit, onRemove }) => {
  return (
    <div className="family-member-table">
      <h3>Family Members</h3>
      {familyMembers.length === 0 ? (
        <p>No family members added yet.</p>
      ) : (
        <table>
          <thead>
          <tr>
            <th>Name</th>
            <th>Sex</th>
            <th>Date of Birth</th>
            <th>Twin Status</th>
            <th>Adopted</th>
            <th>Health</th>
            <th>Race</th>
            <th>Ethnicity</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          {familyMembers.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.sex}</td>
              <td>{member.dateOfBirth}</td>
              <td>{member.twinStatus}</td>
              <td>{member.adopted ? 'Yes' : 'No'}</td>
              <td>{member.health}</td>
              <td>{member.race.join(', ')}</td>
              <td>{member.ethnicity.join(', ')}</td>
              <td>
                <button onClick={() => onEdit(member)}>Edit</button>
                <button onClick={() => onRemove(member.id)}>Remove</button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

FamilyMemberTable.propTypes = {
  familyMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sex: PropTypes.string.isRequired,
      dateOfBirth: PropTypes.string.isRequired,
      twinStatus: PropTypes.string.isRequired,
      adopted: PropTypes.bool.isRequired,
      health: PropTypes.string,
      race: PropTypes.arrayOf(PropTypes.string).isRequired,
      ethnicity: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default FamilyMemberTable;
