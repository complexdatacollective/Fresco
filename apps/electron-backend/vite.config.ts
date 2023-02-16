import { rmSync } from 'node:fs'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(() => {
  rmSync('dist', { recursive: true, force: true })

  return {
    build: {
      // ssr: true,
      sourcemap: 'inline',
      // Minify when in producrion
      minify: process.env.MODE !== 'development',
      target: 'node18',
      outDir: 'dist',
      assetsDir: '.',
      lib: {
        entry: ["./src/main.ts", "./src/preload.ts"],
        fileName: "[name]",
        formats: ["cjs"],
      },
      rollupOptions: {
        // input: {
        //   "main": "./src/main.ts",
        //   "preload": "./src/preload.ts",
        // },
        external: [
          'electron',
          'electron-devtools-installer',
          'electron-log',
          'electron-updater',
          'prisma',
          "@prisma/client",
          "superjson",
        ]
      },
      emptyOutDir: true,
    },
  }
})