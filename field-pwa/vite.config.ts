import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'locales/**/*.json'],
      workbox: {
        // App shell — cache-first, update in background
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico}'],
        runtimeCaching: [
          {
            // Replay structured field submissions when connectivity returns.
            // Matches the real NLAMS server's routes (server/src/routes) —
            // NOT Bhumitra's old /api/documents/upload or /api/rr-records,
            // which this backend never implemented. Proposal document
            // uploads go through /api/proposals/:id/documents instead.
            urlPattern:
              /^https?:\/\/.*\/api\/(parcels\/verify|proposals\/[^/]+\/documents|grievances)(?:\/.*)?$/i,
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: {
                name: 'bhumitra-api-write-queue',
                options: { maxRetentionTime: 60 * 24 * 7 }
              }
            }
          },
          {
            // Replay consent updates when connectivity returns.
            urlPattern: /^https?:\/\/.*\/api\/proposals\/[^/]+\/consent$/i,
            handler: 'NetworkOnly',
            method: 'PATCH',
            options: {
              backgroundSync: {
                name: 'bhumitra-api-write-queue',
                options: { maxRetentionTime: 60 * 24 * 7 }
              }
            }
          },
          {
            // API data — network-first, fall back to cache (offline)
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bhumitra-api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
          ,{
            // OpenStreetMap tiles — cache-first (precious offline bandwidth)
            urlPattern: /^https:\/\/\w\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bhumitra-map-tiles',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'Bhumitra Field App',
        short_name: 'Bhumitra',
        description: 'Offline-first field PWA for India land acquisition officers (DoLR SIH26016)',
        theme_color: '#1F3864',
        background_color: '#eef3f8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      devOptions: { enabled: true, type: 'module' }
    })
  ],
  resolve: { alias: { '@': '/src' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/leaflet')) return 'leaflet';
          if (id.includes('node_modules/dexie')) return 'dexie';
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'i18n';
        }
      }
    }
  }
});
