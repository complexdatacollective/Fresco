// FamilyMemberTable.js
import React from 'react';
import PropTypes from 'prop-types';

const FamilyMemberTable = ({ familyMembers = [], onEdit, onRemove }) => {
  return (
    <div className="family-member-table" style={{ marginTop: '20px' }}>
      <h3>Family Members</h3>
      {familyMembers.length === 0 ? (
        <p>No family members added yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Relationship</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Sex</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date of Birth</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Twin Status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Adopted</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Health</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Race</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ethnicity</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
          </tr>
          </thead>
          <tbody>
          {familyMembers.map((member) => (
            <tr key={member.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.relation}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.sex}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.dateOfBirth}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.twinStatus}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.adopted ? 'Yes' : 'No'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.health}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.race.join(', ')}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.ethnicity.join(', ')}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button
                  onClick={() => onEdit(member)}
                  style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Edit
                </button>
                {['Self', 'Mother', 'Father'].includes(member.relation) ? (
                  <button
                    disabled
                    style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'not-allowed', opacity: 0.6 }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => onRemove(member.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
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
      relation: PropTypes.string.isRequired,
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
