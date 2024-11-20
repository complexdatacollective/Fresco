// FamilyTreePreview.js
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const FamilyTreePreview = ({ familyMembers, onClose }) => {
  const canvasRef = useRef(null);
  const nodes = useRef([]);
  const isDragging = useRef(false);
  const draggedNode = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';

    const clearCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const drawNodes = () => {
      clearCanvas();
      nodes.current.forEach((node) => {
        const { x, y, member, color } = node;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillText(member.name || member.relation, x, y);
      });
    };

    const setupNodes = () => {
      nodes.current = [];
      const horizontalSpacing = 150;
      const verticalSpacing = 100;
      const startX = canvas.width / 2;
      const startY = 50;

      const addNode = (x, y, member, color = '#999999') => {
        nodes.current.push({ x, y, member, color });
      };

      const maternalGrandparents = familyMembers.filter(member => member.relation.includes('Maternal Grand'));
      const paternalGrandparents = familyMembers.filter(member => member.relation.includes('Paternal Grand'));
      maternalGrandparents.forEach((gp, index) => {
        addNode(startX - horizontalSpacing * 2 + index * horizontalSpacing, startY, gp);
      });
      paternalGrandparents.forEach((gp, index) => {
        addNode(startX + horizontalSpacing + index * horizontalSpacing, startY, gp);
      });

      const parentY = startY + verticalSpacing;
      const mother = familyMembers.find(member => member.relation === 'Mother');
      const father = familyMembers.find(member => member.relation === 'Father');
      const maternalAuntsUncles = familyMembers.filter(member => member.relation.includes('Maternal') && (member.relation.includes('Uncle') || member.relation.includes('Aunt')));
      const paternalAuntsUncles = familyMembers.filter(member => member.relation.includes('Paternal') && (member.relation.includes('Uncle') || member.relation.includes('Aunt')));

      maternalAuntsUncles.forEach((au, index) => {
        addNode(startX - horizontalSpacing * 2 + index * horizontalSpacing, parentY, au);
      });
      if (mother) addNode(startX - horizontalSpacing, parentY, mother);
      if (father) addNode(startX + horizontalSpacing, parentY, father);
      paternalAuntsUncles.forEach((au, index) => {
        addNode(startX + horizontalSpacing + index * horizontalSpacing, parentY, au);
      });

      // Self and siblings
      const self = familyMembers.find(member => member.relation === 'Self');
      const siblings = familyMembers.filter(member => member.relation === 'Brother' || member.relation === 'Sister');
      const selfY = parentY + verticalSpacing;

      if (self) addNode(startX, selfY, self, '#0000FF');
      siblings.forEach((sibling, index) => {
        addNode(startX - (siblings.length - 1) * horizontalSpacing / 2 + index * horizontalSpacing, selfY, sibling);
      });

      const children = familyMembers.filter(member => member.relation === 'Son' || member.relation === 'Daughter');
      const childY = selfY + verticalSpacing;

      children.forEach((child, index) => {
        addNode(startX - (children.length - 1) * horizontalSpacing / 2 + index * horizontalSpacing, childY, child);
      });
    };

    setupNodes();
    drawNodes();

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      nodes.current.forEach((node) => {
        const distance = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2);
        if (distance < 30) {
          isDragging.current = true;
          draggedNode.current = node;
        }
      });
    };

    const handleMouseMove = (e) => {
      if (isDragging.current && draggedNode.current) {
        const rect = canvas.getBoundingClientRect();
        draggedNode.current.x = e.clientX - rect.left;
        draggedNode.current.y = e.clientY - rect.top;
        drawNodes();
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      draggedNode.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [familyMembers]);

  return (
    <div className="family-tree-preview" style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Family Tree Preview</h2>
      <button
        onClick={onClose}
        style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Close Preview
      </button>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '1px solid #ddd' }}></canvas>
    </div>
  );
};

FamilyTreePreview.propTypes = {
  familyMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      relation: PropTypes.string.isRequired,
      parentId: PropTypes.string,
      sex: PropTypes.string,
      dateOfBirth: PropTypes.string,
      twinStatus: PropTypes.string,
      adopted: PropTypes.bool,
      health: PropTypes.string,
      race: PropTypes.arrayOf(PropTypes.string),
      ethnicity: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FamilyTreePreview;
