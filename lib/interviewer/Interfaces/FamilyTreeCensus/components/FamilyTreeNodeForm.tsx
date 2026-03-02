import { type Form as TForm } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '~/components/ui/Button';
import Dialog from '~/lib/dialogs/Dialog';
import { type FieldValue } from '~/lib/form/components/Field/types';
import Form from '~/lib/form/components/Form';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import {
  addNode as addNetworkNode,
  updateNode as updateNetworkNode,
} from '~/lib/interviewer/ducks/modules/session';
import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import {
  type NodeIsEgo,
  type RelationshipToEgo,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import {
  getNodeIsEgoVariable,
  getNodeSexVariable,
  getRelationshipToEgoVariable,
  normalizeRelationshipToEgoLabel,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/utils/nodeUtils';
import { getPromptAdditionalAttributes } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';

type FamilyTreeNodeFormProps = {
  nodeType: string;
  selectedNode: FamilyTreeNodeType | void;
  form: TForm;
  diseaseVars: string[];
  onClose: () => void;
};

const FamilyTreeNodeForm = (props: FamilyTreeNodeFormProps) => {
  const { nodeType, selectedNode, form, diseaseVars, onClose } = props;

  const newNodeAttributes = useSelector(getPromptAdditionalAttributes);
  const nodeSexVariable = useSelector(getNodeSexVariable);
  const nodeIsEgoVariable = useSelector(getNodeIsEgoVariable);
  const relationshipToEgoVariable = useSelector(getRelationshipToEgoVariable);

  const [show, setShow] = useState(false);

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
      void dispatch(updateNetworkNode(payload)).then(() => {
        // find shell node by interviewNetworkId
        const shellId = getShellIdByNetworkId(payload.nodeId);
        if (shellId) {
          updateShellNode(shellId, {
            fields: payload.newAttributeData,
          });
          syncMetadata();
        }
      });
    },
    [dispatch, getShellIdByNetworkId, syncMetadata, updateShellNode],
  );

  // Calculate initial values for the form
  const initialValues = useMemo(() => {
    const values: Record<string, FieldValue> = {};

    if (!selectedNode) return values;

    form.fields.forEach((field: { variable: string }) => {
      // Check in fields first (updated values), then fall back to top-level
      const fields = selectedNode.fields;
      const fieldValue =
        fields && typeof fields === 'object'
          ? (fields[field.variable] as VariableValue | undefined)
          : undefined;
      let topValue: VariableValue | undefined;
      if (field.variable === nodeSexVariable) {
        topValue = selectedNode.sex;
      }
      const value = fieldValue ?? topValue;

      // Only include non-null values (FieldValue doesn't accept null)
      if (value !== undefined && value !== null) {
        values[field.variable] = value as FieldValue;
      }
    });

    return values;
  }, [selectedNode, form.fields, nodeSexVariable]);

  // Generate field components using the same hook as NodeForm
  const { fieldComponents } = useProtocolForm({
    fields: form.fields,
    autoFocus: true,
    initialValues,
  });

  const handleSubmit: FormSubmitHandler = useCallback(
    (values) => {
      const formValues = values as Record<string, VariableValue>;
      if (!selectedNode || !selectedNode.id) return { success: true };

      if (selectedNode.interviewNetworkId) {
        // Existing node → update only the editable fields
        void updateNode({
          nodeId: selectedNode.interviewNetworkId,
          newAttributeData: formValues,
        });
      } else {
        // Placeholder → commit
        const fullPayload = {
          ...newNodeAttributes,
          ...formValues,
        };
        void commitShellNode(selectedNode, fullPayload);
      }

      setShow(false);
      onClose();
      return { success: true };
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
      <Dialog
        open={show}
        title={form.title ?? ''}
        closeDialog={handleClose}
        className="node-form"
        footer={
          <Button
            key="submit"
            type="submit"
            form="family-tree-node-form"
            aria-label="Finished"
            color="primary"
          >
            Finished
          </Button>
        }
      >
        <Form id="family-tree-node-form" onSubmit={handleSubmit} className="w-full">
          {fieldComponents}
        </Form>
      </Dialog>
    </>
  );
};

export default FamilyTreeNodeForm;
