Please update the drag and drop system (~/lib/dnd) in the following ways:

- Replace the createUniqueId function with use of React's useID hook, with an appropriate prefix where required. Remove the createUniqueId function from the codebase.
- Investigate if the auto scrolling feature is working correctly or implemented. If it is not, remove references to it in the code and all hooks/partial implementation.
- Remove the DragPreview component, as it is not used in the current implementation. Ensure you update all references to it.
- useDragSource:
  - Rename the 'preview' prop to 'previewContent' to clarify its purpose.
  - Change the "name" property to "announcedName" to clarify its purpose. Update all references.
  - Move the 'type' and 'id' properties out of the metadata object and up one level and ensure that they are required.
  - Ensure that the metadata object is entirely optional.
  - When dragging starts, hide the original element.
- useDropTarget:
  - Remove the 'zoneId' property, and use the React useId hook for generating a stable ID for drop targets.
- Organize the code:
  - Move the type definitions to the hook or component definitions that use them, and keep only truly shared types in the `types.ts` file. Update all imports accordingly, ensuring that you use path aliases.
  - Group hooks by their purpose (state, refs, store subscriptions) to improve readability.
  - Remove redundant or trivial comments that do not add value.
- Search ~/lib/dnd for TODO comments and address them. Prompt to confirm the implementation plan.
- Simplify the Storybook stories for this feature:
  - Remove the "Complete System Demo" entirely.
  - Remove the DragPreview component story.
  - Remove the built in example section (button, header, page) and the "Configure your project" doc.
  - Ensure that the remaining stories match the patterns used in the example page ~/app/(interview)/interview/example/page.tsx.

Use sub agents where necessary to handle complex tasks. Use playwright mcp to validate your changes run correctly in the browser when required, or do debug errors.
