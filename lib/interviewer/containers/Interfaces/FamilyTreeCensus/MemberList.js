// MemberList.js
import React from 'react';
import PropTypes from 'prop-types';

const MemberList = ({ members, onEdit, onDelete }) => {
  return (
    <div className="member-list">
      <h2>Family Members</h2>
      {members.length === 0 ? (
        <p>No family members added yet.</p>
      ) : (
        <ul>
          {members.map((member, index) => (
            <li key={index}>
              <p>{member.name}</p>
              <button onClick={() => onEdit(index)}>Edit</button>
              <button onClick={() => onDelete(index)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

MemberList.propTypes = {
  members: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default MemberList;
