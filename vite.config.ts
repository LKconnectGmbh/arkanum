import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Basis-Pfad: '/' bei Vercel, '/<repo>/' bei GitHub Pages (VITE_BASE in der Pages-Workflow-Datei)
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        start_url: base,
        scope: base,
        name: 'Arkanum – Die Wächter von Mondfels',
        short_name: 'Arkanum',
        description: 'Solo-Deckbuilding-Kartenspiel',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E1020',
        theme_color: '#0E1020',
        icons: [{ src: `${base}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  worker: { format: 'es' },
  build: { target: 'es2020' },
});
