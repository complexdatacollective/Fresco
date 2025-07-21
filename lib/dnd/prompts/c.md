I now want you to create a new drag and drop system that can replace the existing one.

The key requirements of this new system are:

- Full compatibility with React 19.
- Support for existing use-cases and features of the old system, BUT NOTE: simplification of the API and the overall architecture is required! If the way the feature is implemented currently can be improved, or refactored, please do so. Simplicity and elegance is valued above all else!
- Do NOT reproduce the "drop obstacle" feature.
- Functional components throughout. No class components. No HOCs.
- Create hooks with simple APIs that provide props to be spread onto the consuming component, and dedicated state.
- State should include 'canDrop' (if a drop zone will accept the currently dragged item), 'isOver' (if the current pointer position is over the drop zone), and dragItem (the item being dragged) for drop zones.
- Make sure the store structure is as simple as possible, and meets all the requirements of the library that you choose to use for state management. For example, ensure that the store structure allows for updates that do not cause unnecessary re-renders of components that do not need to be updated. Do not store unserializable data in the store, such as DOM elements or functions.
- FOCUS ON PERFORMANCE! No use of setInterval or timeouts unless absolutely necessary. Prefer requestAnimationFrame, and the use of transform for performance reasons. Use modern APIs and approaches to binding to element size changes, throttling, hit detection (weak maps, binary space partitioning), caching, etc.
- Do NOT use an external library for any functionality. Create this system from scratch
- Use the pointer events API for drag and drop, not the HTML5 drag and drop API. Remember to keep the core functionality of the current system, including the ability to specify a drag preview component. Ensure you take into account dragging items from within scrollable containers.
- Implement updating dropzone size and position in response to the element changing size/position in a performant and modern way. This should take into account changes due to scrolling, resizing, and transforms.
- Choose a library to use for the state/store based on the requirements of the system. Redux Toolkit is a good choice, but you may also consider Zustand or Jotai if they better suit the needs of the drag and drop system.
- Review the code for performance. Make sure that updating the drag item position does not cause unnecessary re-renders for drop zones unless their isOver state changes (canDrop can be calculated once when the drag begins). Ensure that dropzone size and position updates are throttled or debounced to avoid performance issues during rapid drag movements, and that these updates do not cause other components to re-render unnecessarily.
- Ensure that the drag and drop system is accessible, including keyboard navigation and screen reader support.

Implementation steps:

- Create new components in `~/lib/dnd`. Limit files to a single component or hook.
- ALWAYS use typescript. Check for existing types and re-use them where appropriate.
- Locate types next to the component they are used in, or in `~/lib/dnd/types.ts` if they are shared. Use zod to create schemas and infer types from them where appropriate.
- Remember to format and lint files. Use pnpm and check package.json for available scripts.
- Use sub agents where appropriate to make your work more efficient.
- Use tailwind v4 for styling. Refer to globals.css for theme variables.
- Do not remove or modify existing drag and drop components.
- Do NOT yet update any usage of the old system - we wil save this for the next step.
- Create an example page at `~/app/(interview)/interview/example/page.tsx` that demonstrates all functionality.

Do not run the development server in order to test your changes. Instead, create tests that cover the new functionality and ensure that the tests pass.
