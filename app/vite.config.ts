import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.GITHUB_PAGES === 'true' ? '/NASA-Space-App-Challenge-A-Team/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'models/body.glb'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,glb}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
      },
      manifest: {
        name: 'Astro Health Monitor',
        short_name: 'Astro Health',
        description: 'Self-assessment health monitor for astronauts on long-duration missions.',
        theme_color: '#ffffff',
        background_color: '#f6f7f9',
        display: 'standalone',
        start_url: '.',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
