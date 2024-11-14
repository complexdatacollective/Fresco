// FamilyTreeCensus.js
import React, { useState } from 'react';
import FamilyTreeCensusForm from './FamilyTreeCensusForm';
import MemberList from './MemberList';
import EditMemberForm from './EditMemberForm';
import AddMemberForm from './AddMemberForm';

const FamilyTreeCensus = ({ stage }) => {
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [members, setMembers] = useState([]);
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);

  const handleSkipForm = () => setIsFormVisible(false);

  const handleAddMember = (member) => {
    setMembers([...members, member]);
  };

  const handleEditMember = (updatedMember) => {
    const updatedMembers = [...members];
    updatedMembers[editingMemberIndex] = updatedMember;
    setMembers(updatedMembers);
    setEditingMemberIndex(null);
  };

  const handleDeleteMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const startEditMember = (index) => {
    setEditingMemberIndex(index);
  };

  return (
    <div className="family-tree-census">
      <div className="family-tree-census__container">
        {isFormVisible ? (
          <>
            <FamilyTreeCensusForm stage={stage} />
            <button onClick={handleSkipForm} className="skip-button">
              Skip
            </button>
          </>
        ) : (
          <div>
            {editingMemberIndex !== null ? (
              <EditMemberForm
                memberData={members[editingMemberIndex]}
                onSave={handleEditMember}
                onCancel={() => setEditingMemberIndex(null)}
              />
            ) : (
              <AddMemberForm
                onAdd={handleAddMember}
                onCancel={() => {}}
              />
            )}
            <MemberList
              members={members}
              onEdit={startEditMember}
              onDelete={handleDeleteMember}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyTreeCensus;
