// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    allowedHosts: [
      'b8d8-202-125-147-182.ngrok-free.app',
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});
