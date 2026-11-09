import { defineConfig } from 'vite';

// Use a fixed GitHub Pages base path so JS, CSS and GLB assets always resolve
// correctly even when visitors open a deep link or use a stale browser cache.
export default defineConfig({
  base: '/ITS-4.0-new/',
  build: { outDir: 'dist', assetsDir: 'assets' }
});
