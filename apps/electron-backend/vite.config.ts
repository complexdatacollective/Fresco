import { rmSync } from 'node:fs'
import { defineConfig, BuildOptions } from 'vite'
import electron from 'vite-plugin-electron'
import pkg from './package.json'

const isBuild = process.env.MODE !== 'development';

const externals = [
  'electron',
  'electron-devtools-installer',
  'electron-log',
  'electron-updater',
  'prisma',
  "@prisma/client",
  "superjson",
  "node:path",
  "http",
];

const buildConfig: BuildOptions = {
  ssr: true, // This prevents an additional file being generated for main. not sure why!
  sourcemap: 'inline',
  // Minify when in producrion
  minify: isBuild,
  target: 'node18',
  lib: {
    entry: ["./src/main.ts", "./src/preload.ts"],
    fileName: "[name]",
    formats: ["cjs"],
  },
  rollupOptions: {
    external: externals
  },
  emptyOutDir: true,
};

// https://vitejs.dev/config/
export default defineConfig(() => {
  rmSync('dist', { recursive: true, force: true })

  return {
    build: buildConfig,
    plugins: [
      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: 'src/main.ts',
          vite: {
            build: {
              sourcemap: 'inline',
              minify: isBuild,
              outDir: 'dist',
              rollupOptions: {
                external: externals
              },
            },
          },
        },
        {
          entry: 'src/preload.ts',
          onstart(options) {
            // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
            // instead of restarting the entire Electron App.
            options.reload()
          },
          vite: {
            build: {
              minify: isBuild,
              outDir: 'dist',
              rollupOptions: {
                external: externals,
              },
            },
          },
        }
      ]),
    ],
  }
})