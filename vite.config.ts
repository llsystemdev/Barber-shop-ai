
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: '.', // Ensure root is current directory
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('motion')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    watch: {
      ignored: ['**/server/db.json', '**/db.json']
    },
    proxy: {
        '/api': 'http://localhost:3000'
    }
  }
});
