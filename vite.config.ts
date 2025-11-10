/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/

const customElements = ['swiper-container', 'swiper-slide']

export default defineConfig({
  plugins: [
      vue({
          template: {
              compilerOptions: {
                  isCustomElement: (tag) => customElements.includes(tag),
              },
          },
      }),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
