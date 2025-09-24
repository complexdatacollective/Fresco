// usePlaceholderNodeFormSubmit.ts
import { useCallback } from 'react';
import type { PlaceholderNodeProps } from './FamilyTreeNode';
import { useRelatives } from './useRelatives';

type VariableValue = string | number | boolean | null;

type UsePlaceholderNodeFormSubmitArgs = {
  egoNodeId: string;
  step2Nodes: PlaceholderNodeProps[];
  newNodeAttributes: Partial<PlaceholderNodeProps>;
  setPlaceholderNodes: (nodes: PlaceholderNodeProps[]) => void;
  setShow: (show: boolean) => void;
  onClose: () => void;
};

export function usePlaceholderNodeFormSubmit({
  egoNodeId,
  step2Nodes,
  newNodeAttributes,
  setPlaceholderNodes,
  setShow,
  onClose,
}: UsePlaceholderNodeFormSubmitArgs) {
  const { getParents } = useRelatives(egoNodeId, step2Nodes);
  const getExPartnerForParent = (
    allNodes: PlaceholderNodeProps[],
    parentNode: PlaceholderNodeProps,
  ) => {
    return allNodes.find((n) => n.id === parentNode.exPartnerId);
  };

  const handleSubmit = useCallback(
    ({ value }: { value: Record<string, VariableValue> }) => {
      const cleanedData = Object.fromEntries(
        Object.entries(value).filter(([_, v]) => v !== '' && v != null),
      );
      const fullData = { ...newNodeAttributes, ...cleanedData };

      let parentsArray: PlaceholderNodeProps[] = [];
      let newNode: PlaceholderNodeProps;
      let newNodeParentIds: string[] = [];

      // 🔑 Decide maternal vs paternal prefix
      const relationLabel =
        step2Nodes.find(
          (n) => n.id === fullData[`${fullData.relation}Relation`],
        )?.label ?? '';

      const isMaternal = /mother|maternal/i.test(relationLabel);
      const labelPrefix = isMaternal ? 'maternal' : 'paternal';

      switch (fullData.relation) {
        case 'aunt':
        case 'uncle': {
          const parentsObject = getParents(
            fullData[`${fullData.relation}Relation`] as string,
          );
          parentsArray = Object.values(parentsObject).filter(Boolean);
          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'aunt' ? 'female' : 'male',
            label: `${labelPrefix} ${fullData.relation}`,
            relationType: fullData.relation,
            parentIds: parentsArray.map((p) => p.id),
            childIds: [],
            xPos: undefined,
            yPos: undefined,
            isEgo: false,
          };
          break;
        }

        case 'brother':
        case 'sister': {
          const egoNode = step2Nodes.find((n) => n.id === egoNodeId);
          if (!egoNode) break;

          parentsArray = step2Nodes.filter((n) =>
            egoNode.parentIds.includes(n.id),
          );

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'sister' ? 'female' : 'male',
            label: fullData.relation,
            relationType: fullData.relation,
            parentIds: parentsArray.map((p) => p.id),
            childIds: [],
            xPos: undefined,
            yPos: undefined,
            isEgo: false,
          };
          break;
        }

        case 'son':
        case 'daughter': {
          const egoNode = step2Nodes.find((n) => n.id === egoNodeId);
          if (!egoNode) break;

          let updatedEgo: PlaceholderNodeProps = egoNode;
          let partnerNode: PlaceholderNodeProps | undefined;

          if (!egoNode.partnerId) {
            const partnerId = crypto.randomUUID();
            partnerNode = {
              id: partnerId,
              gender: egoNode.gender === 'male' ? 'female' : 'male',
              label: `${egoNode.label}'s partner`,
              relationType: 'unrelated',
              parentIds: [],
              childIds: [...(egoNode.childIds ?? [])],
              partnerId: egoNode.id,
              xPos: undefined,
              yPos: undefined,
              isEgo: false,
            };
            updatedEgo = { ...egoNode, partnerId };
            parentsArray = [updatedEgo, partnerNode];
            newNodeParentIds = [updatedEgo.id, partnerId];
          } else {
            partnerNode = step2Nodes.find((n) => n.id === egoNode.partnerId);
            if (partnerNode) {
              parentsArray = [egoNode, partnerNode];
              newNodeParentIds = [egoNode.id, partnerNode.id];
            }
          }

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'son' ? 'male' : 'female',
            label: fullData.relation,
            relationType: fullData.relation,
            parentIds: newNodeParentIds,
            childIds: [],
            xPos: undefined,
            yPos: undefined,
            isEgo: false,
          };

          const updatedEgoWithChildren: PlaceholderNodeProps = {
            ...updatedEgo,
            childIds: [...(updatedEgo.childIds ?? []), newNode.id],
          };

          const updatedPartnerWithChildren: PlaceholderNodeProps | undefined =
            partnerNode
              ? {
                  ...partnerNode,
                  childIds: [...(partnerNode.childIds ?? []), newNode.id],
                }
              : undefined;

          setPlaceholderNodes([
            updatedEgoWithChildren,
            ...(updatedPartnerWithChildren ? [updatedPartnerWithChildren] : []),
            newNode,
          ]);
          setShow(false);
          onClose();
          return; // ⬅ prevent duplicate update at the end
        }

        case 'halfBrother':
        case 'halfSister': {
          const selectedRelative = step2Nodes.find(
            (n) => n.id === fullData[`${fullData.relation}Relation`],
          );
          if (!selectedRelative) break;

          let partnerNode: PlaceholderNodeProps;
          const exPartner = getExPartnerForParent(step2Nodes, selectedRelative);

          if (exPartner) {
            partnerNode = exPartner;
            parentsArray = [selectedRelative, partnerNode];
            newNodeParentIds = [selectedRelative.id, partnerNode.id];
          } else {
            const partnerId = crypto.randomUUID();
            partnerNode = {
              id: partnerId,
              gender: selectedRelative.gender === 'male' ? 'female' : 'male',
              label: `${selectedRelative.label}'s ex partner`,
              relationType: 'unrelated',
              parentIds: [],
              childIds: [],
              xPos: undefined,
              yPos: undefined,
              isEgo: false,
            };
            parentsArray = [selectedRelative, partnerNode];
            newNodeParentIds = [selectedRelative.id, partnerId];
          }

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'halfBrother' ? 'male' : 'female',
            label: `${labelPrefix} ${
              fullData.relation === 'halfBrother'
                ? 'half brother'
                : 'half sister'
            }`,
            relationType: fullData.relation,
            parentIds: newNodeParentIds,
            childIds: [],
            xPos: undefined,
            yPos: undefined,
            isEgo: false,
          };

          const updatedRelativeWithHalfSibling: PlaceholderNodeProps = {
            ...selectedRelative,
            exPartnerId: partnerNode.id,
            childIds: [...(selectedRelative.childIds ?? []), newNode.id],
          };

          const updatedPartnerWithHalfSibling: PlaceholderNodeProps = {
            ...partnerNode,
            exPartnerId: selectedRelative.id,
            childIds: [...(partnerNode.childIds ?? []), newNode.id],
          };

          setPlaceholderNodes([
            updatedRelativeWithHalfSibling,
            updatedPartnerWithHalfSibling,
            newNode,
          ]);
          setShow(false);
          onClose();
          return; // ⬅ prevent duplicate update at the end
        }

        case 'firstCousinMale':
        case 'firstCousinFemale':
        case 'niece':
        case 'nephew':
        case 'granddaughter':
        case 'grandson': {
          const relativeId = fullData[`${fullData.relation}Relation`] as string;
          const selectedRelative = step2Nodes.find((n) => n.id === relativeId);
          if (!selectedRelative) break;

          let updatedSelectedRelative: PlaceholderNodeProps = selectedRelative;
          let partnerNode: PlaceholderNodeProps | undefined;

          if (!selectedRelative.partnerId) {
            const partnerId = crypto.randomUUID();
            partnerNode = {
              id: partnerId,
              gender: selectedRelative.gender === 'male' ? 'female' : 'male',
              label: `${selectedRelative.label}'s partner`,
              relationType: 'unrelated',
              parentIds: [],
              childIds: [...(selectedRelative.childIds ?? [])],
              partnerId: selectedRelative.id,
              xPos: undefined,
              yPos: undefined,
              isEgo: false,
            };
            updatedSelectedRelative = { ...selectedRelative, partnerId };
            parentsArray = [updatedSelectedRelative, partnerNode];
            newNodeParentIds = [updatedSelectedRelative.id, partnerId];
          } else {
            partnerNode = step2Nodes.find(
              (n) => n.id === selectedRelative.partnerId,
            );
            if (partnerNode) {
              parentsArray = [selectedRelative, partnerNode];
              newNodeParentIds = [selectedRelative.id, partnerNode.id];
            }
          }

          newNode = {
            id: crypto.randomUUID(),
            gender:
              fullData.relation === 'firstCousinMale'
                ? 'male'
                : fullData.relation === 'firstCousinFemale'
                  ? 'female'
                  : fullData.relation === 'niece'
                    ? 'female'
                    : fullData.relation === 'nephew'
                      ? 'male'
                      : fullData.relation === 'granddaughter'
                        ? 'female'
                        : 'male',
            label:
              fullData.relation === 'firstCousinMale' ||
              fullData.relation === 'firstCousinFemale'
                ? `${labelPrefix} cousin`
                : fullData.relation,
            relationType: fullData.relation,
            parentIds: newNodeParentIds,
            childIds: [],
            xPos: undefined,
            yPos: undefined,
            isEgo: false,
          };

          const updatedRelativeWithChild: PlaceholderNodeProps = {
            ...updatedSelectedRelative,
            childIds: [...(updatedSelectedRelative.childIds ?? []), newNode.id],
          };

          const updatedPartnerWithChild: PlaceholderNodeProps | undefined =
            partnerNode
              ? {
                  ...partnerNode,
                  childIds: [...(partnerNode.childIds ?? []), newNode.id],
                }
              : undefined;

          setPlaceholderNodes([
            updatedRelativeWithChild,
            ...(updatedPartnerWithChild ? [updatedPartnerWithChild] : []),
            newNode,
          ]);
          setShow(false);
          onClose();
          return;
        }

        default:
          console.warn('Unhandled relation type', fullData.relation);
          return;
      }

      // 🔑 Generic case → update parents + new node
      const updatedParents = parentsArray.map((parent) => ({
        ...parent,
        childIds: [...(parent.childIds ?? []), newNode.id],
      }));

      setPlaceholderNodes([...updatedParents, newNode]);
      setShow(false);
      onClose();
    },
    [newNodeAttributes, onClose, step2Nodes, setPlaceholderNodes, setShow],
  );

  return { handleSubmit };
}
