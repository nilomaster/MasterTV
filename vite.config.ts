import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configure base as relative so it works on any subdirectory (e.g. XAMPP /mastertv/)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
