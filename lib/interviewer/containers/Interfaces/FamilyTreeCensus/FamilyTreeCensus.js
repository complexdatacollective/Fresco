// FamilyTreeCensus.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AddFamilyMember from './AddFamilyMember';
import FamilyMemberTable from './FamilyMemberTable';

const FamilyTreeCensus = ({ initialFamilyMembers }) => {
  const [familyMembers, setFamilyMembers] = useState(initialFamilyMembers);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMember = () => {
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
  };

  const handleSaveAdd = (newMember) => {
    setFamilyMembers((prevMembers) => [...prevMembers, newMember]);
    setIsAdding(false);
  };

  const handleRemoveMember = (memberId) => {
    setFamilyMembers((prevMembers) => prevMembers.filter((member) => member.id !== memberId));
  };

  const handleEditMember = (updatedMember) => {
    setFamilyMembers((prevMembers) =>
      prevMembers.map((member) => (member.id === updatedMember.id ? updatedMember : member))
    );
  };

  return (
    <div className="family-tree-census">
      <h2>Family Tree Census</h2>
      <button onClick={handleAddMember}>Add Family Member</button>

      {isAdding && (
        <AddFamilyMember onCancel={handleCancelAdd} onSave={handleSaveAdd} />
      )}

      <FamilyMemberTable
        familyMembers={familyMembers}
        onEdit={handleEditMember}
        onRemove={handleRemoveMember}
      />
    </div>
  );
};

FamilyTreeCensus.propTypes = {
  initialFamilyMembers: PropTypes.arrayOf(
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
};

export default FamilyTreeCensus;
