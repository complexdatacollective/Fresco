import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@behaviours', replacement: fileURLToPath(new URL('./src/behaviours/', import.meta.url)) },
      { find: '@components', replacement: fileURLToPath(new URL('./src/components', import.meta.url)) },
      { find: '@containers', replacement: fileURLToPath(new URL('./src/containers', import.meta.url)) },
      { find: '@contexts', replacement: fileURLToPath(new URL('./src/contexts', import.meta.url)) },
      { find: '@ducks', replacement: fileURLToPath(new URL('./src/ducks', import.meta.url)) },
      { find: '@hooks', replacement: fileURLToPath(new URL('./src/hooks', import.meta.url)) },
      { find: '@images', replacement: fileURLToPath(new URL('./src/images', import.meta.url)) },
      { find: '@interfaces', replacement: fileURLToPath(new URL('./src/components/interfaces', import.meta.url)) },
      { find: '@routes', replacement: fileURLToPath(new URL('./src/routes', import.meta.url)) },
      { find: '@selectors', replacement: fileURLToPath(new URL('./src/selectors', import.meta.url)) },
      { find: '@styles', replacement: fileURLToPath(new URL('./src/styles', import.meta.url)) },
      { find: '@utils', replacement: fileURLToPath(new URL('./src/utils', import.meta.url)) },
    ],
  },
  server: {
    host: '127.0.0.1', // For some reason, localhost doesn't work
  }
});