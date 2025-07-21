We are about to begin a complex task. This app contains an interview feature, that presents users with a series of screens (Stages) where a task is to be performed. Files related to this feature are located in ~/lib/interviewer. Many of the interactions involve dragging and dropping. We developed a custom drag-and-drop system in ~/lib/interviewer/behaviours/DragAndDrop (and ~/lib/interviewer/behaviours/withBounds.js) that includes features such as:

1. making a component into a drop target (with the ability to manage items that are accepted via a function that is invoked with the item that is currently being dragged).
2. making a component draggable, and attaching metadata about it.
3. defining drop "obstacles" (areas where drops are not allowed).

This system has a number of issues:

1. It uses findDOMNode, which has been removed from react-dom in React 19, making it incompatible.
2. It uses class components and HOC patterns and not hooks and functional components.
3. It stores functions and other unserializable data in the redux store. The store is not reflective of modern redux (RTK) patterns.

Your job is to help me address these issues.

Please examine the existing implementation of the drag and drop system, taking note of the functionality of the system. Next, create a detailed specification of the features of this system, and which components use this system. Use sub agents where appropriate to make your work more efficient.
