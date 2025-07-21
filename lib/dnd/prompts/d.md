I see the following issues in the system:

- Items that are dropped do not appear in the list of the drop target, and are not removed from the drag source.
- There is no visual indication for the keyboard functionality, so I cannot test if it is working. Pressing tab does not show visually where the focus is.

Additionally:

- Clean up the useDropTarget hook. The hook should accept an accepts array, and optional handlers for onDragStart, onDragEnd, and onDrop. It should return isDragging, isOver, willAccept, and dragItem properties, along with the dragSourceProps to be spread onto the draggable element.
- There is use of the `any` type in the new code - this is NOT allowed!
- tslint and eslint rules have been disabled in some places - this is NOT allowed!
- the dragItem provided to drop targets does not need to contain the x,y,width and height properties since these are not relevant for the drop target. Instead, the dragItem should only contain the type and metadata properties.
- Please update to use tailwind v4 for styling, along with the `cn` utility for conditional class names. Consult globals.css for the current tailwind configuration. You can use the style attribute for drag and drop specific styles where absolutely necessary, but prefer tailwind classes otherwise.
