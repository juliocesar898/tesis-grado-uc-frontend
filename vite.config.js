import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Esto previene de raíz el ReferenceError "global is not defined" en el navegador
    global: 'window', 
  }
})