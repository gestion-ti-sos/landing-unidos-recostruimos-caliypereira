// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
  // Compresión y prefetch conservador: preferimos payload chico
  // sobre lo que sea, dado el contexto de datos móviles inestables.
  prefetch: false,
});
