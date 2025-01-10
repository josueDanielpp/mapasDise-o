import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite exponer el servidor en la red local
    port: 5173, // (Opcional) Cambia el puerto si lo necesitas
  },
})
