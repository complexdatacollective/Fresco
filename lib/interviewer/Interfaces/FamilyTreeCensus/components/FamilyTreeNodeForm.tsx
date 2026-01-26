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
import Button from '~/components/ui/Button';
import Form from '~/lib/form/components/Form';
import Overlay from '~/lib/interviewer/components/Overlay';
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
  getRelationshipToEgoVariable,
  getSexVariable,
  normalizeRelationshipToEgoLabel,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/utils/nodeUtils';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import { useAppDispatch } from '~/lib/interviewer/store';
import { Scroller } from '~/lib/legacy-ui/components';

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
  const sexVariable = useSelector(getSexVariable);
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
        if (sexVariable != null && node.sex != null) {
          attributes[sexVariable] = node.sex;
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
            name: attributes.name as string,
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
      sexVariable,
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
      const { name, ...attributes } = payload.newAttributeData;
      void dispatch(updateNetworkNode(payload)).then(() => {
        // find shell node by interviewNetworkId
        const shellId = getShellIdByNetworkId(payload.nodeId);
        if (shellId) {
          updateShellNode(shellId, {
            name: name as string,
            fields: attributes,
          });
          syncMetadata();
        }
      });
    },
    [dispatch, getShellIdByNetworkId, syncMetadata, updateShellNode],
  );

  const getInitialValues = useCallback(() => {
    const values: Record<string, VariableValue> = {};

    if (!selectedNode) return values;

    form.fields.forEach((field: { variable: string }) => {
      // Check in fields first (updated values), then fall back to top-level
      const fields = selectedNode.fields;
      const fieldValue =
        fields && typeof fields === 'object'
          ? (fields[field.variable] as VariableValue | undefined)
          : undefined;
      let topValue: VariableValue | undefined;
      switch (field.variable) {
        case 'name':
          topValue = selectedNode.name;
          break;
        case 'sex':
          topValue = selectedNode.sex;
          break;
      }
      const value = fieldValue ?? topValue;

      if (value !== undefined) {
        values[field.variable] = value;
      }
    });

    return values;
  }, [selectedNode, form.fields]);

  const handleSubmit = useCallback(
    (values: unknown) => {
      const { value } = values as { value: Record<string, VariableValue> };
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
        title={form.title ?? ''}
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
      >
        <Scroller>
          <Form
            {...({
              ref: formRef,
              fields: form.fields,
              handleSubmit,
              getInitialValues,
              focusFirstInput: true,
            } as unknown as React.ComponentProps<typeof Form>)}
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default FamilyTreeNodeForm;
