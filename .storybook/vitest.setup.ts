import { beforeAll } from 'vitest';
import preview from './preview';

// CSF Factories setup: https://storybook.js.org/docs/api/csf/csf-factories
// Addons are automatically included via definePreview in preview.tsx
beforeAll(preview.composed.beforeAll);
