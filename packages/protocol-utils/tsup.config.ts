import { defineConfig } from 'tsup';

export default defineConfig({
  sourcemap: true,
  clean: true,
  entryPoints: [
    // 'src/migrate/index.ts',
    // 'src/schemas/buildSchemas.ts',
    'src/validate/index.ts'
  ],
  format: ['esm'],
  dts: true,
  treeshake: true,
  splitting: true,
  minify: true,
});
