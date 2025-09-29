export const FamilyTreeShells = () => {
  const step2CensusForm = {
    fields: [],
    title: 'Add Relative',
  };

  return <div>Hello</div>;

  // return (
  //   <div className="family-pedigree-interface">
  //     <AddFamilyMemberForm
  //       selectedNode={null}
  //       form={step2CensusForm}
  //       disabled={false}
  //       onClose={function (): void {}}
  //       setPlaceholderNodes={setPlaceholderNodesBulk}
  //       egoNodeId={egoNodeId}
  //     />
  //     <Scroller className="family-tree-census-scroller">
  //       <div
  //         className="census-node-canvas"
  //         style={{
  //           position: 'relative',
  //           width: canvasWidth,
  //           height: canvasHeight,
  //         }}
  //       >
  //         <div className="edge-layout">
  //           {positionedNodes.map((node) => {
  //             return (
  //               node.partnerId != null && (
  //                 <UIPartnerConnector
  //                   key={keyCounter++}
  //                   xStartPos={(node.xPos ?? 0) + 10 + xOffset}
  //                   xEndPos={
  //                     (familyTreeNodesById[node.partnerId]?.xPos ?? 0) -
  //                     20 +
  //                     xOffset
  //                   }
  //                   yPos={node.yPos + yOffset}
  //                 />
  //               )
  //             );
  //           })}
  //           {positionedNodes.map((node) => {
  //             return (
  //               node.exPartnerId != null && (
  //                 <UIExPartnerConnector
  //                   key={keyCounter++}
  //                   xStartPos={(node.xPos ?? 0) + 10 + xOffset}
  //                   xEndPos={
  //                     (familyTreeNodesById[node.exPartnerId]?.xPos ?? 0) -
  //                     20 +
  //                     xOffset
  //                   }
  //                   yPos={node.yPos + yOffset}
  //                 />
  //               )
  //             );
  //           })}
  //           {positionedNodes.map((node) => {
  //             return (
  //               node.partnerId != null &&
  //               (node.childIds?.length ?? 0) > 0 && (
  //                 <UIOffspringConnector
  //                   key={keyCounter++}
  //                   xPos={
  //                     ((node.xPos ?? 0) +
  //                       (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
  //                       2 +
  //                     xOffset
  //                   }
  //                   yStartPos={(node.yPos ?? 0) + yOffset}
  //                   yEndPos={(node.yPos ?? 0) + rowHeight / 3 + 30 + yOffset}
  //                 />
  //               )
  //             );
  //           })}
  //           {positionedNodes.map((node) => {
  //             return (
  //               node.exPartnerId != null &&
  //               (node.childIds?.length ?? 0) > 0 && (
  //                 <UIOffspringConnector
  //                   key={keyCounter++}
  //                   xPos={
  //                     ((node.xPos ?? 0) +
  //                       (familyTreeNodesById[node.exPartnerId]?.xPos ?? 0)) /
  //                       2 +
  //                     xOffset
  //                   }
  //                   yStartPos={(node.yPos ?? 0) - 5 + yOffset}
  //                   yEndPos={(node.yPos ?? 0) + rowHeight / 3 + 30 + yOffset}
  //                 />
  //               )
  //             );
  //           })}
  //           {positionedNodes.map((node) => {
  //             return (
  //               familyTreeNodesById[node.partnerId] != null &&
  //               familyTreeNodesById[node.partnerId] != null &&
  //               node.childIds.length > 0 &&
  //               node.childIds.map((child) => {
  //                 const childNode = familyTreeNodesById[child];
  //                 return (
  //                   <UIChildConnector
  //                     key={keyCounter++}
  //                     xStartPos={(childNode.xPos ?? 0) + xOffset}
  //                     xEndPos={
  //                       ((node.xPos ?? 0) +
  //                         (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
  //                         2 +
  //                       xOffset
  //                     }
  //                     yPos={
  //                       (childNode.yPos ?? 0) - rowHeight / 3 - 15 + yOffset
  //                     }
  //                     height={rowHeight / 3 - 15}
  //                   />
  //                 );
  //               })
  //             );
  //           })}
  //           {positionedNodes.map((node) => {
  //             return (
  //               familyTreeNodesById[node.exPartnerId] != null &&
  //               familyTreeNodesById[node.exPartnerId] != null &&
  //               node.childIds.length > 0 &&
  //               node.childIds.map((child) => {
  //                 const childNode = familyTreeNodesById[child];
  //                 return (
  //                   <UIChildConnector
  //                     key={keyCounter++}
  //                     xStartPos={(childNode.xPos ?? 0) + xOffset}
  //                     xEndPos={
  //                       ((node.xPos ?? 0) +
  //                         (familyTreeNodesById[node.exPartnerId]?.xPos ?? 0)) /
  //                         2 +
  //                       xOffset
  //                     }
  //                     yPos={
  //                       (childNode.yPos ?? 0) - rowHeight / 3 - 15 + yOffset
  //                     }
  //                     height={rowHeight / 3 - 15}
  //                   />
  //                 );
  //               })
  //             );
  //           })}
  //         </div>
  //         <div className="node-layout" ref={elementRef}>
  //           <div className="inner-node-layout">
  //             <FamilyTreePlaceholderNodeList
  //               items={positionedNodesWithOffsets(
  //                 positionedNodes,
  //                 xOffset,
  //                 yOffset,
  //               )}
  //               listId={`${stage.id}_MAIN_NODE_LIST`}
  //               id="MAIN_NODE_LIST"
  //               accepts={({ meta }: { meta: { itemType: string | null } }) =>
  //                 get(meta, 'itemType', null) === 'PLACEHOLDER_NODE'
  //               }
  //               itemType="PLACEHOLDER_NODE"
  //               onDrop={() => {}}
  //               onItemClick={() => {}}
  //             />
  //           </div>
  //         </div>
  //       </div>
  //     </Scroller>
  //     <NodeBin
  //       accepts={(node: PlaceholderNodeProps & { itemType: string }) =>
  //         node.itemType === 'PLACEHOLDER_NODE'
  //       }
  //       dropHandler={(meta: PlaceholderNodeProps) =>
  //         removePlaceholderNode(meta.id)
  //       }
  //     />
  //   </div>
  // );
};
