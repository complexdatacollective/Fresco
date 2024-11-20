// FamilyTreeCensus.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FamilyBuildForm from './FamilyBuildForm';
import AddFamilyMember from './AddFamilyMember';
import FamilyMemberTable from './FamilyMemberTable';
import EditFamilyMember from './EditFamilyMember';
import FamilyTreePreview from './FamilyTreePreview';

const VIEW = {
  SELF_INFO: 'SELF_INFO',
  BUILD_FAMILY: 'BUILD_FAMILY',
  ADD_MEMBER: 'ADD_MEMBER',
  EDIT_MEMBER: 'EDIT_MEMBER',
  PREVIEW: 'PREVIEW',
  TABLE: 'TABLE',
};

const FamilyTreeCensus = ({ initialFamilyMembers }) => {
  const [familyMembers, setFamilyMembers] = useState(initialFamilyMembers);
  const [currentView, setCurrentView] = useState(VIEW.SELF_INFO);
  const [isEditing, setIsEditing] = useState(null);
  const [selfData, setSelfData] = useState(null);

  const handleSaveSelfData = (data) => {
    setSelfData(data);
    setFamilyMembers((prevMembers) => [
      ...prevMembers,
      { ...data, id: 'self', relation: 'Self' },
      { id: 'mother', name: '', relation: 'Mother', parentId: 'self', sex: '', dateOfBirth: '', twinStatus: 'No', adopted: false, health: '', race: [], ethnicity: [] },
      { id: 'father', name: '', relation: 'Father', parentId: 'self', sex: '', dateOfBirth: '', twinStatus: 'No', adopted: false, health: '', race: [], ethnicity: [] },
    ]);
    setCurrentView(VIEW.BUILD_FAMILY);
  };

  const handleBuildFamily = (builtMembers) => {
    const formattedMembers = builtMembers.flatMap(({ relation, count }, index) => (
      Array.from({ length: count }, (_, i) => ({
        id: `initial-${relation}-${index}-${i}`,
        name: '',
        relation,
        parentId: 'self', // Assuming children are added relative to self
        sex: '',
        dateOfBirth: '',
        twinStatus: 'No',
        adopted: false,
        health: '',
        race: [],
        ethnicity: [],
      }))
    ));

    setFamilyMembers((prevMembers) => [...prevMembers, ...formattedMembers]);
    setCurrentView(VIEW.TABLE);
  };

  const handleAddMember = () => {
    setCurrentView(VIEW.ADD_MEMBER);
  };

  const handleCancelAdd = () => {
    setCurrentView(VIEW.TABLE);
  };

  const handleSaveAdd = (newMember) => {
    setFamilyMembers((prevMembers) => [...prevMembers, newMember]);
    setCurrentView(VIEW.TABLE);
  };

  const handleRemoveMember = (memberId) => {
    if (['self', 'mother', 'father'].includes(memberId)) {
      alert('Cannot remove Self, Mother, or Father.');
      return;
    }
    setFamilyMembers((prevMembers) => prevMembers.filter((member) => member.id !== memberId));
  };

  const handleEditMember = (member) => {
    setIsEditing(member);
    setCurrentView(VIEW.EDIT_MEMBER);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setCurrentView(VIEW.TABLE);
  };

  const handleSaveEdit = (updatedMember) => {
    setFamilyMembers((prevMembers) =>
      prevMembers.map((member) => (member.id === updatedMember.id ? updatedMember : member))
    );
    setIsEditing(null);
    setCurrentView(VIEW.TABLE);
  };

  const handleGeneratePreview = () => {
    setCurrentView(VIEW.PREVIEW);
  };

  const handleClosePreview = () => {
    setCurrentView(VIEW.TABLE);
  };

  return (
    <div className="family-tree-census" style={{ display: 'flex', flexWrap: 'wrap', overflow: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {currentView === VIEW.SELF_INFO && (
        <AddFamilyMember onSave={handleSaveSelfData} onCancel={() => {}} isSelf />
      )}
      {currentView === VIEW.BUILD_FAMILY && (
        <FamilyBuildForm onSave={handleBuildFamily} />
      )}
      {currentView === VIEW.ADD_MEMBER && (
        <AddFamilyMember onCancel={handleCancelAdd} onSave={handleSaveAdd} />
      )}
      {currentView === VIEW.EDIT_MEMBER && (
        <EditFamilyMember
          member={isEditing}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
        />
      )}
      {currentView === VIEW.PREVIEW && (
        <FamilyTreePreview familyMembers={familyMembers} onClose={handleClosePreview} />
      )}
      {currentView === VIEW.TABLE && (
        <>
          <button
            onClick={handleAddMember}
            style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Add Family Member
          </button>
          <button
            onClick={handleGeneratePreview}
            style={{ marginBottom: '20px', marginLeft: '10px', padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Generate Family Tree Preview
          </button>
          <FamilyMemberTable
            familyMembers={familyMembers}
            onEdit={handleEditMember}
            onRemove={handleRemoveMember}
          />
        </>
      )}
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
      parentId: PropTypes.string, // Added parentId to track relationships
    })
  ),
};

FamilyTreeCensus.defaultProps = {
  initialFamilyMembers: [],
};

export default FamilyTreeCensus;
