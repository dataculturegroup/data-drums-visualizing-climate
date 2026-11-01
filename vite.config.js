import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const page = (p) => resolve(import.meta.dirname, p);

// Relative asset paths so dist/ works on GitHub Pages subpaths, Netlify Drop, or locally.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        home: page('index.html'),
        tutorial: page('tutorial/index.html'),
        currentEmissions: page('current-emissions/index.html'),
        solutions: page('solutions/index.html'),
      },
    },
  },
});
