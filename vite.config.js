import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // Import the 'path' module
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],
  base: '/diving/',
  resolve: { // Add resolve configuration
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // Alias '@' to the 'src' directory
    },
  }
})
