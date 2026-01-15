import { type Form as TForm } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';
import { useProtocolFieldProcessor } from '~/lib/form/hooks/useProtocolFieldProcessor';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { useFamilyTreeStore } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import {
  type NodeIsEgo,
  type RelationshipToEgo,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import {
  getNameVariable,
  getNodeIsEgoVariable,
  getNodeSexVariable,
  getRelationshipToEgoVariable,
  normalizeRelationshipToEgoLabel,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/utils/nodeUtils';
import Overlay from '~/lib/interviewer/containers/Overlay';
import {
  addNode as addNetworkNode,
  updateNode as updateNetworkNode,
} from '~/lib/interviewer/ducks/modules/session';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import { useAppDispatch } from '~/lib/interviewer/store';
import { Button, Scroller } from '~/lib/ui/components';

type FamilyTreeNodeFormProps = {
  nodeType: string;
  selectedNode: FamilyTreeNodeType | void;
  form: TForm;
  diseaseVars: string[];
  onClose: () => void;
};

const FamilyTreeNodeForm = (props: FamilyTreeNodeFormProps) => {
  const { nodeType, selectedNode, form, diseaseVars, onClose } = props;

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const nameVariable = useSelector(getNameVariable);
  const nodeSexVariable = useSelector(getNodeSexVariable);
  const nodeIsEgoVariable = useSelector(getNodeIsEgoVariable);
  const relationshipToEgoVariable = useSelector(getRelationshipToEgoVariable);

  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const updateShellNode = useFamilyTreeStore((state) => state.updateNode);
  const getShellIdByNetworkId = useFamilyTreeStore(
    (state) => state.getShellIdByNetworkId,
  );
  const syncMetadata = useFamilyTreeStore((state) => state.syncMetadata);
  const dispatch = useAppDispatch();

  const commitShellNode = useCallback(
    async (
      node: FamilyTreeNodeType,
      attributes: NcNode[EntityAttributesProperty],
    ) => {
      if (!node) return;

      try {
        if (nodeSexVariable != null && node.sex != null) {
          attributes[nodeSexVariable] = node.sex;
        }
        if (nodeIsEgoVariable != null) {
          attributes[nodeIsEgoVariable] = (node.isEgo ?? false) as NodeIsEgo;
        }
        if (relationshipToEgoVariable != null && node.label != null) {
          attributes[relationshipToEgoVariable] = (
            node.isEgo ? 'ego' : normalizeRelationshipToEgoLabel(node.label)
          ) as RelationshipToEgo;
        }

        // set default disease values
        diseaseVars.forEach((disease) => {
          attributes[disease] = false;
        });
        const resultAction = await dispatch(
          addNetworkNode({
            type: nodeType,
            modelData: { [entityPrimaryKeyProperty]: node.id },
            attributeData: attributes,
          }),
        );

        if (addNetworkNode.fulfilled.match(resultAction)) {
          updateShellNode(node.id, {
            interviewNetworkId: node.id,
            name: attributes[nameVariable] as string,
            fields: attributes,
          });
          syncMetadata();
        } else {
          // eslint-disable-next-line no-console
          console.warn('addNetworkNode failed — skipping metadata update');
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error committing shell node:', err);
      }
    },
    [
      nameVariable,
      nodeSexVariable,
      nodeIsEgoVariable,
      relationshipToEgoVariable,
      diseaseVars,
      dispatch,
      nodeType,
      updateShellNode,
      syncMetadata,
    ],
  );

  const updateNode = useCallback(
    (payload: {
      nodeId: NcNode[EntityPrimaryKey]; // network ID
      newAttributeData: NcNode[EntityAttributesProperty];
    }) => {
      const nameValue = payload.newAttributeData[nameVariable];
      const { [nameVariable]: _, ...attributes } = payload.newAttributeData;
      void dispatch(updateNetworkNode(payload)).then(() => {
        // find shell node by interviewNetworkId
        const shellId = getShellIdByNetworkId(payload.nodeId);
        if (shellId) {
          updateShellNode(shellId, {
            name: nameValue as string,
            fields: attributes,
          });
          syncMetadata();
        }
      });
    },
    [dispatch, getShellIdByNetworkId, syncMetadata, updateShellNode, nameVariable],
  );

  const processedFields = useProtocolFieldProcessor({
    fields: form.fields,
    validationMeta: {
      entityId: selectedNode?.id,
    },
  });

  const getInitialValues = useCallback(() => {
    const values: Record<string, VariableValue> = {};

    if (!selectedNode) return values;

    form.fields.forEach((field: { variable: string }) => {
      // Check in fields first (updated values), then fall back to top-level
      const fieldValue = (
        selectedNode.fields as Record<string, unknown> | undefined
      )?.[field.variable];
      let topValue;
      if (field.variable === nameVariable) {
        topValue = selectedNode.name;
      } else if (field.variable === nodeSexVariable) {
        topValue = selectedNode.sex;
      }
      const value = fieldValue ?? topValue;

      if (value !== undefined) {
        values[field.variable] = value as VariableValue;
      }
    });

    return values;
  }, [selectedNode, form.fields, nameVariable, nodeSexVariable]);

  const handleSubmit = useCallback(
    ({ value }: { value: Record<string, VariableValue> }) => {
      if (!selectedNode || !selectedNode.id) return;

      if (selectedNode.interviewNetworkId) {
        // Existing node → update only the editable fields
        void updateNode({
          nodeId: selectedNode.interviewNetworkId,
          newAttributeData: value,
        });
      } else {
        // Placeholder → commit
        const fullPayload = {
          ...newNodeAttributes,
          ...value,
        };
        void commitShellNode(selectedNode, fullPayload);
      }

      setShow(false);
      onClose();
    },
    [selectedNode, onClose, updateNode, newNodeAttributes, commitShellNode],
  );

  // When a selected node is passed in, we are editing an existing node.
  // We need to show the form and populate it with the node's data.
  useEffect(() => {
    if (selectedNode) {
      setShow(true);
    }
  }, [selectedNode]);

  const handleClose = useCallback(() => {
    setShow(false);
    onClose();
  }, [onClose]);

  return (
    <>
      <Overlay
        show={show}
        title={form.title}
        onClose={handleClose}
        className="node-form"
        footer={
          <Button
            key="submit"
            aria-label="Submit"
            onClick={() => {
              formRef.current?.requestSubmit();
            }}
          >
            Finished
          </Button>
        }
        allowMaximize={false}
      >
        <Scroller>
          <Form
            ref={formRef}
            fields={processedFields}
            handleSubmit={handleSubmit}
            getInitialValues={getInitialValues}
            focusFirstInput={true}
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default FamilyTreeNodeForm;
