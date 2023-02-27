import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/app.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18.12',
  outfile: './dist/app.js',
  sourcemap: true,
  packages: "external" // Don't bundle node_modules
})