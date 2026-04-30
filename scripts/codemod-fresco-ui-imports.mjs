import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const rules = [
  // Order: specific rules first, catch-alls last
  [/from '~\/components\/ui\/Modal\/(.+?)'/g, "from '@codaco/fresco-ui/Modal/$1'"],
  [/from '~\/components\/ui\/Modal'/g, "from '@codaco/fresco-ui/Modal'"],
  [/from '~\/components\/ui\/dnd\/(.+?)'/g, "from '@codaco/fresco-ui/dnd/$1'"],
  [/from '~\/components\/ui\/dnd'/g, "from '@codaco/fresco-ui/dnd/dnd'"],
  [/from '~\/components\/ui\/dialogs\/(.+?)'/g, "from '@codaco/fresco-ui/dialogs/$1'"],
  [/from '~\/components\/ui\/collection\/(.+?)'/g, "from '@codaco/fresco-ui/collection/$1'"],
  [/from '~\/components\/ui\/form\/(.+?)'/g, "from '@codaco/fresco-ui/form/$1'"],
  [/from '~\/components\/ui\/typography\/(.+?)'/g, "from '@codaco/fresco-ui/typography/$1'"],
  [/from '~\/components\/ui\/layout\/(.+?)'/g, "from '@codaco/fresco-ui/layout/$1'"],
  [/from '~\/components\/ui\/(.+?)'/g, "from '@codaco/fresco-ui/$1'"],
  [/from '~\/utils\/cva'/g, "from '@codaco/fresco-ui/utils/cva'"],
  [/from '~\/utils\/composeEventHandlers'/g, "from '@codaco/fresco-ui/utils/composeEventHandlers'"],
  [/from '~\/utils\/NoSSRWrapper'/g, "from '@codaco/fresco-ui/utils/NoSSRWrapper'"],
  [/from '~\/hooks\/useSafeAnimate'/g, "from '@codaco/fresco-ui/hooks/useSafeAnimate'"],
  [/from '~\/hooks\/useNodeInteractions'/g, "from '@codaco/fresco-ui/hooks/useNodeInteractions'"],
  [/from '~\/hooks\/usePrevious'/g, "from '@codaco/fresco-ui/hooks/usePrevious'"],
  [/from '~\/hooks\/useResizablePanel'/g, "from '@codaco/fresco-ui/hooks/useResizablePanel'"],
  [/from '~\/hooks\/useSafeLocalStorage'/g, "from '@codaco/fresco-ui/hooks/useSafeLocalStorage'"],
  [/from '~\/styles\/shared\/controlVariants'/g, "from '@codaco/fresco-ui/styles/controlVariants'"],
];

const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo', '.git']);
const ROOT = process.cwd();
const EXCLUDE_PREFIX = join(ROOT, 'components', 'ui');

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      // Exclude components/ui (those get deleted in G5)
      if (full === EXCLUDE_PREFIX) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      if (full.endsWith('.ts') || full.endsWith('.tsx')) {
        yield full;
      }
    }
  }
}

let touched = 0;
let totalReplacements = 0;
for await (const f of walk(ROOT)) {
  const before = await readFile(f, 'utf8');
  let after = before;
  for (const [re, to] of rules) {
    after = after.replace(re, to);
  }
  if (after !== before) {
    await writeFile(f, after);
    touched++;
    const beforeCount = (before.match(/@codaco\/fresco-ui/g) || []).length;
    const afterCount = (after.match(/@codaco\/fresco-ui/g) || []).length;
    totalReplacements += (afterCount - beforeCount);
  }
}
// eslint-disable-next-line no-console
console.log(`rewrote ${totalReplacements} imports across ${touched} files (excluding components/ui/)`);
