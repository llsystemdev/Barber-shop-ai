
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: '.', // Ensure root is current directory
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    watch: {
      ignored: ['**/server/db.json', '**/db.json']
    },
    proxy: {
        '/api': 'http://localhost:8080'
    }
  }
});
