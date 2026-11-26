import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


const BACKEND = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
        proxy: {
      '/auth': BACKEND,
      '/users': BACKEND,
      '/health': BACKEND,
      '/posts': BACKEND,
      '/comments': BACKEND,
      '/reports': BACKEND,
      '/courses': BACKEND,
      '/modules': BACKEND,
      '/lessons': BACKEND,
      '/connections': BACKEND,
      '/chat': BACKEND,
    },
  },
})