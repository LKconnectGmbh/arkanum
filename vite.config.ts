import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Arkanum – Die Wächter von Mondfels',
        short_name: 'Arkanum',
        description: 'Solo-Deckbuilding-Kartenspiel',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E1020',
        theme_color: '#0E1020',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  worker: { format: 'es' },
  build: { target: 'es2020' },
});
