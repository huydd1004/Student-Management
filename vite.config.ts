import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Student-Management/',

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'prompt',

      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon-180x180.png',
      ],

      manifest: {
        id: '/Student-Management/',
        name: 'Quản lý lớp 5.15 – Tiểu học An Bình',
        short_name: 'Lớp 5.15',
        description:
          'Ứng dụng quản lý lớp 5.15 – Trường Tiểu học An Bình.',

        lang: 'vi',
        start_url: '/Student-Management/',
        scope: '/Student-Management/',

        display: 'standalone',
        background_color: '#fff7fb',
        theme_color: '#c2185b',

        categories: ['education', 'productivity'],
        prefer_related_applications: false,

        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
})