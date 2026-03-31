import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/autoservice-pwa/index.html',
        navigateFallbackDenylist: [/^\/autoservice-pwa\/api/],
        runtimeCaching: [{
          urlPattern: /supabase\.co/,
          handler: 'NetworkOnly',
        }],
      },
      manifest: {
        name: 'Автосервіс',
        short_name: 'Автосервіс',
        description: 'CRM для автосервісу',
        start_url: '/autoservice-pwa/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0F172A',
        theme_color: '#2563EB',
        icons: [
          { src: '/autoservice-pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/autoservice-pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  base: '/autoservice-pwa/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
