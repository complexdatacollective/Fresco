# DND System Migration Plan

## Overview

This document outlines the migration strategy from the old DND system (`lib/interviewer/behaviours/DragAndDrop`) to the new system (`lib/dnd/`). The old system uses HOCs, findDOMNode, and Redux state, while the new system uses hooks, refs, and Zustand for state management.

## New DND System Summary

### Key Components
- **DndStoreProvider**: Context provider that wraps the app
- **useDragSource**: Hook for creating draggable items
- **useDropTarget**: Hook for creating drop zones
- **Built-in accessibility**: Keyboard navigation and screen reader support
- **Type-safe**: Full TypeScript support with metadata passing

### Key Differences
- No HOCs - uses hooks instead
- No findDOMNode - uses refs
- Built-in keyboard navigation
- Automatic position tracking
- Source zone tracking to prevent self-drops

## Components to Migrate

### Phase 1: Simple Components (Low Complexity)
These components have straightforward DND usage and can be migrated first:

1. **CategoricalItem** (`lib/interviewer/components/CategoricalItem.tsx`)
   - Uses: DropTarget, MonitorDropTarget HOCs
   - Migration: Convert to useDropTarget hook

2. **NodeBin** (`lib/interviewer/components/NodeBin.js`)
   - Uses: DropTarget, MonitorDropTarget HOCs
   - Migration: Convert to useDropTarget hook with delete functionality

3. **OrdinalBins** (`lib/interviewer/containers/OrdinalBins.js`)
   - Uses: MonitorDragSource HOC
   - Migration: Use store state for monitoring drag state

4. **CategoricalList** (`lib/interviewer/containers/CategoricalList/CategoricalList.js`)
   - Uses: MonitorDragSource HOC
   - Migration: Use store state for monitoring

5. **NodePanels** (`lib/interviewer/containers/NodePanels.tsx`)
   - Uses: MonitorDragSource HOC
   - Migration: Use store state for monitoring

6. **SearchableList** (`lib/interviewer/containers/SearchableList.tsx`)
   - Uses: useDropMonitor hook
   - Migration: Adapt to new hook pattern

7. **PresetSwitcher** (`lib/interviewer/containers/Canvas/PresetSwitcher.js`)
   - Uses: DropObstacle HOC
   - Migration: May not need migration if just preventing drops

### Phase 2: Medium Complexity Components
These components have more complex DND patterns:

8. **MultiNodeBucket** (`lib/interviewer/components/MultiNodeBucket.tsx`)
   - Uses: DragSource HOC, NO_SCROLL constant
   - Migration: Convert to useDragSource hook

9. **NodeList** (`lib/interviewer/components/NodeList.js`)
   - Uses: DragSource, DropTarget, Monitor HOCs
   - Complex hover state logic
   - Migration: Convert to both hooks, handle hover states

10. **HyperList** (`lib/interviewer/containers/HyperList/HyperList.js`)
    - Uses: DragSource, DropTarget, MonitorDropTarget HOCs
    - Virtual list integration
    - Migration: Careful integration with virtual scrolling

### Phase 3: Canvas Components - EXCLUDED FROM CURRENT MIGRATION
These components will remain on the old DND system and require a separate custom solution:

11. **NodeBucket** (`lib/interviewer/containers/Canvas/NodeBucket.js`)
    - Uses: DragSource, DropObstacle HOCs
    - **Status**: EXCLUDED - staying on old system

12. **NodeLayout** (`lib/interviewer/containers/Canvas/NodeLayout.js`)
    - Uses: DropTarget HOC
    - **Status**: EXCLUDED - staying on old system

13. **LayoutNode** (`lib/interviewer/components/Canvas/LayoutNode.js`)
    - Uses: DragManager directly
    - **Status**: EXCLUDED - staying on old system

14. **Annotations** (`lib/interviewer/containers/Canvas/Annotations.js`)
    - Uses: DragManager, NO_SCROLL
    - **Status**: EXCLUDED - staying on old system

## Additional Changes Required

### 1. Add DndStoreProvider to InterviewShell
Location: `app/(interview)/interview/_components/InterviewShell.tsx`

```tsx
import { DndStoreProvider } from '~/lib/dnd';

// Wrap the Provider components:
<Provider store={store(decodedPayload)}>
  <DndStoreProvider>
    <ProtocolScreen />
    <DialogManager />
  </DndStoreProvider>
</Provider>
```

### 2. Update Imports
- Replace imports from `~/lib/interviewer/behaviours/DragAndDrop`
- Import from `~/lib/dnd` instead

### 3. Convert HOC Patterns to Hooks
- Replace HOC wrapping with hook usage
- Move props to hook options
- Handle ref forwarding properly

### 4. Handle State Management
- Monitor components can use the DND store state
- Redux actions remain unchanged for node operations

## Migration Strategy

### Approach
1. **Incremental Migration**: Migrate one component at a time
2. **Backward Compatibility**: Keep old system during migration
3. **Testing**: Test each component after migration
4. **Start Simple**: Begin with Phase 1 components

### Component Migration Template
```tsx
// Old HOC pattern
export default compose(
  DragSource({ /* options */ }),
  DropTarget({ /* options */ })
)(Component);

// New hook pattern
const Component = () => {
  const { dragProps } = useDragSource({
    type: 'node',
    metadata: { /* data */ },
    announcedName: 'Node'
  });
  
  const { dropProps } = useDropTarget({
    id: 'unique-id',
    accepts: ['node'],
    onDrop: (metadata) => { /* handler */ }
  });
  
  return <div {...dragProps} {...dropProps}>Content</div>;
};
```

## Special Considerations

### Accessibility
- New system has built-in keyboard navigation
- Ensure announcedName is provided for all draggable/droppable elements
- Test with screen readers after migration

### TypeScript
- Convert `.js` files to `.tsx` where beneficial
- Use proper typing for metadata
- Replace `interface` with `type` as per guidelines

## Canvas Components: Critical Migration Challenges

### Where Canvas Components Are Used

The Canvas components are core to two major interview interfaces:

1. **Sociogram Interface**: Interactive network visualization for sociometric data collection
   - Uses `NodeLayout`, `NodeBucket`, and `LayoutNode` for positioned node manipulation
   - Enables drag-and-drop positioning, edge creation, and automatic layout simulation

2. **Narrative Interface**: Storytelling and network visualization with preset layouts
   - Uses `NodeLayout` for displaying nodes according to preset configurations
   - Supports multiple layouts, convex hulls, annotations, and highlighting

### Why Portal Rendering Is a Critical Concern

The Canvas components use a complex **hybrid DOM/React architecture**:

**Current Implementation:**
- `NodeLayout` creates DOM elements imperatively using `document.createElement('div')`
- Each node gets absolutely positioned with `position: 'absolute'` and `transform: 'translate(-50%, -50%)'`
- `LayoutNode` uses `ReactDOM.createPortal` to render React components into these pre-created DOM elements
- `DragManager` attaches directly to portal DOM elements outside React's event system

**Migration Challenges:**
- Modern DND libraries expect consistent React component trees with standard event propagation
- Portal architecture separates visual DOM layout from logical React tree
- Custom drag previews use imperative DOM manipulation instead of declarative React patterns
- Event handling mixes imperative listeners with React synthetic events

### Why Coordinate Handling Is a Critical Concern

The Canvas system uses a **dual coordinate system** with complex transformations:

**Current Implementation:**
- **Relative coordinates**: Nodes stored as percentages (0-1) in Redux for layout variables
- **Screen coordinates**: Calculated pixel positions for visual rendering via ScreenManager
- **Real-time conversion**: Every drag operation converts between coordinate systems multiple times
- **Responsive handling**: Uses ResizeObserver and viewport offset calculations

**Migration Challenges:**
- Modern DND libraries work in screen coordinates only
- Custom ScreenManager handles viewport dimensions and dynamic resizing
- Coordinate clamping and transformation logic is deeply integrated
- Two-mode networks require different coordinate systems per node type

**Specific Technical Complexity:**
```javascript
// Relative to screen conversion
x: (x - 0.5) * width + 0.5 * width
y: (y - 0.5) * height + 0.5 * height

// Screen to relative conversion
x: clamp((x - viewportX) / width, 0, 1)
y: clamp((y - viewportY) / height, 0, 1)
```

### Migration Decisions Made

1. **Canvas Components**: Will remain on the old DND system for now and require a separate custom solution later
2. **State Management**: Migrate fully to Zustand as components are migrated
3. **Testing**: Use Playwright MCP for verifying migrations

## Next Steps

1. Set up DndStoreProvider in InterviewShell  
2. Start with Phase 1 components (simple drop targets)
3. Create test protocols using Playwright MCP to verify functionality
4. Migrate state from Redux to Zustand as each component is converted
5. Document any issues or edge cases discovered during migration

## Success Criteria

- All non-Canvas components migrated (Phases 1-2)
- Canvas components (Phase 3) remain on old system until custom solution is developed
- Sociogram interface excluded as specified
- No regressions in functionality for migrated components
- Improved accessibility for migrated components
- Cleaner, more maintainable code using hooks instead of HOCs
- State management migrated from Redux to Zustand for DND-related state