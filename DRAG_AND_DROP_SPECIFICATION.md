# Drag-and-Drop System Specification

## Overview

The Fresco interview application uses a custom drag-and-drop system located in `lib/interviewer/behaviours/DragAndDrop` to enable interactive node manipulation across various interface types. The system supports dragging nodes between lists, bins, canvases, and other UI elements.

## Core Features

### 1. Draggable Components (DragSource)

- **Purpose**: Makes any React component draggable
- **Implementation**: Higher-Order Component (HOC) pattern
- **Key Features**:
  - Attaches metadata to dragged items
  - Creates visual drag preview
  - Supports both mouse and touch events
  - Configurable scrolling behavior (NO_SCROLL option)
  - Dispatches drag state to Redux store

### 2. Drop Targets (DropTarget)

- **Purpose**: Designates areas where dragged items can be dropped
- **Implementation**: HOC that wraps components
- **Key Features**:
  - `accepts` function to determine valid drops based on metadata
  - `onDrop` callback when item is dropped
  - `onDrag` callback during drag over target
  - `onDragEnd` callback when drag ends
  - Automatic position tracking and hit detection
  - Visual feedback through `isOver` and `willAccept` states

### 3. Drop Obstacles (DropObstacle)

- **Purpose**: Defines areas where drops are not allowed
- **Implementation**: HOC similar to DropTarget
- **Key Features**:
  - Blocks drops in specific UI areas
  - Automatically updates position in Redux store
  - Used for UI controls that shouldn't accept drops

### 4. Boundary Detection (withBounds)

- **Purpose**: Tracks component dimensions and position
- **Implementation**: HOC using ResizeObserver
- **Key Features**:
  - Real-time boundary updates
  - Used for coordinate calculations in canvas interfaces
  - Provides width, height, x, y props to wrapped components

### 5. State Monitoring

- **MonitorDragSource**: HOC that subscribes to drag source state changes
- **MonitorDropTarget**: HOC that subscribes to drop target state changes
- **useDropMonitor**: Hook version of MonitorDropTarget (modern alternative)

## Technical Architecture

### Redux Store Structure

```javascript
{
  dragAndDrop: {
    targets: [
      {
        id: string,
        accepts: Function,      // (meta) => boolean
        onDrop: Function,       // (meta) => void
        onDrag: Function,       // (meta) => void
        onDragEnd: Function,    // () => void
        x: number,
        y: number,
        width: number,
        height: number,
        isOver: boolean,
        willAccept: boolean
      }
    ],
    obstacles: [
      {
        id: string,
        x: number,
        y: number,
        width: number,
        height: number
      }
    ],
    source: {
      id: string,
      meta: any,              // User-defined metadata
      x: number,
      y: number,
      width: number,
      height: number,
      setValidMove: Function  // (valid) => void
    } | null
  }
}
```

### Event Flow

1. **Drag Start**:
   - DragSource creates DragManager instance
   - DragPreview is instantiated
   - DRAG_START action dispatched with source metadata

2. **Drag Move**:
   - DragManager updates position
   - DRAG_MOVE action triggers hit detection
   - Valid targets receive onDrag callbacks
   - Visual feedback updated (cursor, target highlighting)

3. **Drag End**:
   - Valid drop target receives onDrop callback
   - All targets receive onDragEnd callback
   - DragPreview is destroyed
   - DRAG_END action clears source state

## Component Usage Patterns

### Basic Draggable Component

```javascript
export default compose(
  DragSource({
    meta: { nodeId: props.node.id, type: 'EXISTING_NODE' },
    scrollable: true,
  }),
)(NodeComponent);
```

### Basic Drop Target

```javascript
export default compose(
  DropTarget({
    accepts: ({ meta }) => meta.type === 'EXISTING_NODE',
    onDrop: ({ meta }) => handleNodeDrop(meta.nodeId),
  }),
  MonitorDropTarget(['isOver', 'willAccept']),
)(DropZoneComponent);
```

### Drop Obstacle

```javascript
export default DropObstacle(UIControlComponent);
```

## Components Using the System

### Lists and Containers

- **NodeList**: Draggable nodes with drop zone functionality
- **HyperList**: Virtual scrolling list with drag-and-drop
- **SearchableList**: Uses useDropMonitor hook for drop state

### Categorization Interfaces

- **CategoricalList/CategoricalItem**: Drag nodes into categorical bins
- **OrdinalBins**: Ordinal value assignment via drag-and-drop
- **NodeBin**: Drop zone for node removal/deletion

### Canvas Interfaces

- **NodeLayout**: Main canvas drop target for positioned nodes
- **LayoutNode**: Custom drag handling for canvas nodes
- **NodeBucket**: Draggable unplaced nodes with drop obstacle
- **Annotations**: Uses DragManager for drawing gestures

### UI Elements

- **NodePanels**: Shows/hides based on drag compatibility
- **PresetSwitcher**: Drop obstacle to prevent accidental drops
- **MultiNodeBucket**: Stacked nodes with top node draggable

## Known Issues

### 1. React 19 Incompatibility

- Uses deprecated `findDOMNode` in:
  - DropTarget.js
  - DropObstacle.js
  - withBounds.js
- Needs migration to ref-based approach

### 2. Architecture Issues

- Class components instead of functional components
- HOC pattern instead of hooks (except useDropMonitor)
- Separate Redux store instead of integrated slice

### 3. Redux Anti-Patterns

- Stores non-serializable data (functions) in Redux state
- Serialization checks disabled in store configuration
- Side effects in reducer-adjacent code

### 4. Type Safety

- Limited TypeScript coverage
- Missing type definitions for drag metadata
- No type safety for callbacks and accepts functions

## Migration Requirements

### 1. Replace findDOMNode

- Implement ref forwarding in all HOCs
- Use callback refs or forwardRef pattern
- Update withBounds to use refs

### 2. Convert to Hooks

- Create useDragSource hook
- Create useDropTarget hook
- Create useDropObstacle hook
- Migrate withBounds to useBounds hook

### 3. Redux Modernization

- Integrate into main store as RTK slice
- Remove function storage from state
- Implement proper action creators and selectors
- Use event emitter or context for callbacks

### 4. TypeScript Enhancement

- Define types for all drag metadata
- Type-safe HOCs and hooks
- Proper typing for Redux state and actions

## Performance Considerations

- Continuous position updates can cause frequent re-renders
- Hit detection runs on every drag move
- Multiple drop targets increase computation
- Virtual scrolling lists need special handling

## Accessibility Notes

- Current system is mouse/touch only
- No keyboard navigation support
- No screen reader announcements
- Would need ARIA live regions for drag state
