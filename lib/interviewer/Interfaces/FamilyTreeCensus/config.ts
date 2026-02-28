export const FAMILY_TREE_CONFIG = {
  nodeContainerWidth: 150,
  nodeContainerHeight: 160,
  nodeWidth: 80,
  nodeHeight: 80,
  padding: 60,
  get rowHeight() {
    return this.nodeContainerHeight + this.padding;
  },
  get siblingSpacing() {
    // Controls padding between siblings
    return this.nodeContainerWidth;
  },
  get partnerSpacing() {
    return this.nodeContainerWidth;
  },
};
