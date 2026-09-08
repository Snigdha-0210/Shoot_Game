import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative assets work on GitHub Pages, Render, Vercel, and Netlify
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
