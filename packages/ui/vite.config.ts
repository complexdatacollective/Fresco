import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      outputDir: 'dist',
    }),
  ],
  resolve: {
    alias: [
      { find: '@/', replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
  // publicDir: 'public',
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: '@codaco/ui',
      formats: ['es'],
      fileName: 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'framer-motion'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'framer-motion': 'framer-motion',
        },
      },
    },
  },
});
