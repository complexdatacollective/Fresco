/**
 * Collection Component System
 *
 * A collection component with support for:
 * - Flexible layouts (list, grid)
 * - Selection (single, multiple, none)
 * - Keyboard navigation with roving tabindex
 * - Drag and drop (optional)
 *
 * @module collection
 */

// Main component
export { Collection } from './components/Collection';

// Layout system
export { InlineGridLayout } from './layout';

// Drag and drop integration (optional)
export { useDragAndDrop } from './dnd';
