# Network Canvas UI
This package provides design primitives and components for applications that are part of the Network
Canvas project (https://networkcanvas.com).
## 6.0.0 Backlog

- [ ] Update core dependencies
  - [ ] React 18
  - [ ] Framer Latest
  - [ ] Storybook 7
- [ ] Typescript
- [ ] Visual regression testing
- [ ] Accessibility auditing (warnings for now....errors when we get to production)
- [ ] Drag and drop system
- [ ] Virtualised list component, supporting drag and drop, sort, and filter
- [ ] Design primitives
- [ ] Responsiveness
- [ ] Interaction sounds
- [ ] Move CreateSorter and useSort over from network-canvas
  - [ ] Other hooks?
- [ ] Theming

## Installation

Install with npm or link to git in package.json:

```sh
npm install --save @codaco/ui
```

```js
// in package.json
{
  "dependencies": {
    "@codaco/ui": "git+https://git@github.com/complexdatacollective/Network-Canvas-UI.git"
  }
}
```

## Deployment

This is an org package hosted on npmjs.

1. Update the version number in package.json
1. `npm run publish`

## Development (using Storybook)

Run:
`npm run storybook`

A browser window will open with a live-updating view of components.

This is a new feature so not all components are defined.

## Development (using Network Canvas)

```sh
# In UI
$ npm link

# In consuming app
$ npm link @codaco/ui

# After each change (in UI):
$ npm install
$ npm run build
$ npm install --only=production # potentially also rm -rf node_modules
```

To revert in consuming app: `npm install`

### Components

```jsx
// in LocalComponent.js

import { ExampleComponent } from '@codaco/ui';

// To directly link to a component use:
// `import ComponentName from '@codaco/ui/lib/components/ComponentName'`;

const LocalComponent = props => (
  <div className="local-component">
    <ExampleComponent />
  </div>
);
```

### Styles

You can include all styles in your main stylesheet:

```scss
// in main.scss
@import '~@codaco/ui/lib/styles/all';
```

Importing styles for only certain components may work but is not supported at this time.

### Icons

### Colors

To add a new color or palette, you can add a new css variable to the root selector:

``` SASS
:root {
  --my-new-color: blue;
}
```

## What's included

### Component List

- List of components goes here.

## Versioning

This project uses [semantic versioning](http://semver.org/):

`
AA.BB.CC
`

- AA version when you make incompatible API changes,
- BB version when you add functionality in a backwards-compatible manner, and
- CC version when you make backwards-compatible bug fixes.
