import { defineConfig } from 'tsup';

export default defineConfig({
  sourcemap: true,
  clean: true,
  entryPoints: [
    'src/index.ts'
  ],
  format: ['esm', 'cjs'],
  dts: true,
  treeshake: true,
  splitting: true,
  minify: true,
});
